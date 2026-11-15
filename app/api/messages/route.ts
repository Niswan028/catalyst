// API route for voice messages with private storage and signed URLs
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext, createServiceRoleClient } from '@/lib/supabase/authServer';
import { logAuditEvent } from '@/lib/audit';
import { z } from 'zod';

const messageSchema = z.object({
  recipient_id: z.string().uuid(),
  duration_seconds: z.number().int().min(0).max(600).optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedContext(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;
    const adminSupabase = createServiceRoleClient();

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const rawRecipientId = formData.get('recipient_id') as string;
    const rawDuration = formData.get('duration_seconds') as string;

    const validated = messageSchema.safeParse({
      recipient_id: rawRecipientId,
      duration_seconds: rawDuration ? parseInt(rawDuration, 10) : null,
    });

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues?.[0]?.message || 'Invalid recipient or duration' },
        { status: 400 }
      );
    }

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    // Size limit: 10MB
    if (audioFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Audio file must not exceed 10MB' }, { status: 400 });
    }

    // Upload audio to PRIVATE Supabase Storage
    const fileExt = audioFile.name.split('.').pop() || 'webm';
    const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await adminSupabase.storage
      .from('voice-messages')
      .upload(filePath, audioFile, {
        contentType: audioFile.type || 'audio/webm',
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }

    // Generate short-lived signed URL (15 minutes = 900 seconds)
    const { data: signedData, error: signedError } = await adminSupabase.storage
      .from('voice-messages')
      .createSignedUrl(filePath, 900);

    // Save message metadata (stores storage relative path in audio_url)
    const { data: messageData, error: messageError } = await adminSupabase
      .from('voice_messages')
      .insert({
        sender_id: user.id,
        recipient_id: validated.data.recipient_id,
        audio_url: filePath,
        duration_seconds: validated.data.duration_seconds || null,
      })
      .select()
      .single();

    if (messageError) {
      return NextResponse.json({ error: messageError.message }, { status: 400 });
    }

    await logAuditEvent(adminSupabase, {
      actorId: user.id,
      action: 'voice_message_sent',
      resourceType: 'voice_messages',
      resourceId: messageData.id,
      details: { recipientId: validated.data.recipient_id },
    });

    return NextResponse.json({
      message: 'Voice message sent securely',
      voice_message: {
        ...messageData,
        signed_url: signedData?.signedUrl,
      },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedContext(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;
    const adminSupabase = createServiceRoleClient();

    const { searchParams } = new URL(request.url);
    const otherUserId = searchParams.get('user_id');

    let query = adminSupabase
      .from('voice_messages')
      .select('*, sender:users!voice_messages_sender_id_fkey(full_name, email), recipient:users!voice_messages_recipient_id_fkey(full_name, email)');

    if (otherUserId) {
      query = query.or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`
      );
    } else {
      query = query.or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);
    }

    const { data: messages, error } = await query.order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Generate signed URLs for private audio playback
    const messagesWithSignedUrls = await Promise.all(
      (messages || []).map(async (msg) => {
        let storagePath = msg.audio_url;
        // If legacy full url was stored, extract path
        if (storagePath.includes('voice-messages/')) {
          storagePath = storagePath.split('voice-messages/')[1].split('?')[0];
        }

        try {
          const { data: signed } = await adminSupabase.storage
            .from('voice-messages')
            .createSignedUrl(decodeURIComponent(storagePath), 900);

          return {
            ...msg,
            signed_url: signed?.signedUrl || msg.audio_url,
          };
        } catch {
          return {
            ...msg,
            signed_url: msg.audio_url,
          };
        }
      })
    );

    return NextResponse.json({ messages: messagesWithSignedUrls });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedContext(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;
    const adminSupabase = createServiceRoleClient();

    const { message_id, is_read } = await request.json();

    if (!message_id) {
      return NextResponse.json({ error: 'message_id is required' }, { status: 400 });
    }

    const { data, error } = await adminSupabase
      .from('voice_messages')
      .update({ is_read: is_read !== undefined ? is_read : true })
      .eq('id', message_id)
      .eq('recipient_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Message updated', voice_message: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
