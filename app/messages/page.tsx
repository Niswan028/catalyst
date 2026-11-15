// Two-way voice messaging page
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Card from '@/components/Card';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import VoiceRecorder from '@/components/VoiceRecorder';
import { User, VoiceMessage, LinkedUser } from '@/lib/types';
import { format } from 'date-fns';

export default function MessagesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [linkedUsers, setLinkedUsers] = useState<{ elderly_user: User }[]>([]);
  const [circleRecipients, setCircleRecipients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecorder, setShowRecorder] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [recordedAudio, setRecordedAudio] = useState<{
    blob: Blob;
    duration: number;
  } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push('/auth/signin');
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      setUser(userData);
      fetchMessages();
      
      if (userData?.role === 'caregiver') {
        fetchLinkedUsers();
      } else {
        fetchCircleRecipients();
      }
    };
    checkAuth();
  }, [router]);

  const fetchMessages = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/messages', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setMessages(data.messages || []);
      } else {
        console.error('Error fetching messages:', data.error);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLinkedUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const response = await fetch('/api/caregiver/links', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setLinkedUsers(data.links || []);
      } else {
        console.error('Error fetching linked users:', data.error);
      }
    } catch (error) {
      console.error('Error fetching linked users:', error);
    }
  };

  const fetchCircleRecipients = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const cRes = await fetch('/api/circles', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const cData = await cRes.json();
      if (cData.circles && cData.circles.length > 0) {
        const mRes = await fetch(`/api/circles/${cData.circles[0].id}/members`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const mData = await mRes.json();
        if (mData.members) {
          const recips = mData.members
            .filter(
              (m: { user?: User; status?: string }) =>
                m.user && m.user.id !== session.user.id && m.status === 'approved'
            )
            .map((m: { user: User }) => m.user);
          setCircleRecipients(recips);
        }
      }
    } catch (error) {
      console.error('Error fetching circle recipients:', error);
    }
  };

  const handleRecordingComplete = (audioBlob: Blob, duration: number) => {
    setRecordedAudio({ blob: audioBlob, duration });
  };

  const handleSendMessage = async () => {
    if (!recordedAudio || !selectedRecipient) {
      setError('Please record a message and select a recipient');
      return;
    }

    setError('');
    setSuccess('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('Not authenticated');
        return;
      }

      const formData = new FormData();
      // Use the blob's actual type for the file extension
      const fileExtension = recordedAudio.blob.type.includes('ogg') ? 'ogg' : 
                           recordedAudio.blob.type.includes('mp4') ? 'mp4' : 'webm';
      formData.append('audio', recordedAudio.blob, `voice-message.${fileExtension}`);
      formData.append('recipient_id', selectedRecipient);
      formData.append('duration_seconds', recordedAudio.duration.toString());

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setSuccess('Message sent successfully!');
      setShowRecorder(false);
      setRecordedAudio(null);
      setSelectedRecipient('');
      fetchMessages();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to send message';
      setError(msg);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id: messageId, is_read: true }),
      });
      fetchMessages();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Get available recipients
  const recipients =
    user.role === 'caregiver'
      ? linkedUsers.map((link) => link.elderly_user)
      : []; // Elderly users will see caregivers who have sent them messages

  // Get unique caregivers who sent messages (for elderly users)
  const caregiverSenders = user.role === 'elderly_user' 
    ? Array.from(
        new Map(
          messages
            .filter((m) => m.sender_id !== user.id && m.sender)
            .map((m) => [m.sender!.id, m.sender])
        ).values()
      )
    : [];

  // For elderly users, combine circle members and past senders
  const elderRecipientsMap = new Map();
  [...circleRecipients, ...caregiverSenders].forEach((r) => {
    if (r && r.id && !elderRecipientsMap.has(r.id)) {
      elderRecipientsMap.set(r.id, r);
    }
  });
  const allRecipients =
    user.role === 'caregiver' ? recipients : Array.from(elderRecipientsMap.values());

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#e6dfd3] dark:border-stone-800 pb-5">
        <div>
          <span className="text-[11px] uppercase tracking-widest font-bold text-stone-500 dark:text-stone-400 block mb-1">
            Two-Way Voice & Family Circle Communication
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-normal text-stone-900 dark:text-stone-100 tracking-tight leading-tight">
            Voice Messages
          </h1>
          <p className="text-sm text-stone-600 dark:text-stone-300 mt-1.5">
            Send audio updates, daily check-ins, and reassuring notes between elders and family circles.
          </p>
        </div>
        {allRecipients.length > 0 && (
          <Button onClick={() => setShowRecorder(!showRecorder)} className="shrink-0 font-bold">
            {showRecorder ? '✕ Close' : '🎤 New Message'}
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {showRecorder && (
        <Card title="Record Voice Message">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Send to:
              </label>
              <select
                value={selectedRecipient}
                onChange={(e) => setSelectedRecipient(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select recipient...</option>
                {allRecipients.map((recipient: User) => (
                  <option key={recipient.id} value={recipient.id}>
                    {recipient.full_name || recipient.email}
                  </option>
                ))}
              </select>
            </div>

            <VoiceRecorder onRecordingComplete={handleRecordingComplete} />

            {recordedAudio && selectedRecipient && (
              <Button onClick={handleSendMessage} className="w-full" size="lg">
                Send Message
              </Button>
            )}
          </div>
        </Card>
      )}

      {user.role === 'caregiver' && linkedUsers.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-gray-600 mb-4">
              You haven&apos;t linked any elderly users yet.
            </p>
            <p className="text-gray-500 text-sm">
              Contact your administrator to link elderly users to your account.
            </p>
          </div>
        </Card>
      )}

      {messages.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-gray-600 mb-4">No messages yet.</p>
            {allRecipients.length > 0 && (
              <Button onClick={() => setShowRecorder(true)}>Send Your First Message</Button>
            )}
          </div>
        </Card>
      ) : (
        <Card title="All Messages">
          <div className="space-y-4">
            {messages.map((message) => {
              const isSent = message.sender_id === user.id;
              const isUnread = !message.is_read && !isSent;

              return (
                <div
                  key={message.id}
                  className={`border rounded-lg p-4 ${
                    isUnread ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-800">
                        {isSent ? (
                          <>To: {message.recipient?.full_name || message.recipient?.email || 'Care Circle Member'}</>
                        ) : (
                          <>From: {message.sender?.full_name || message.sender?.email || 'Care Circle Member'}</>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(message.created_at), 'MMM dd, yyyy h:mm a')}
                      </p>
                    </div>
                    {isUnread && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        New
                      </span>
                    )}
                  </div>

                  <audio
                    controls
                    src={message.signed_url || message.audio_url}
                    className="w-full mt-2"
                    preload="metadata"
                    crossOrigin="anonymous"
                    onPlay={() => {
                      if (isUnread) {
                        handleMarkAsRead(message.id);
                      }
                    }}
                    onError={() => {
                      setError('Failed to play audio message.');
                    }}
                  />

                  {message.duration_seconds && (
                    <p className="text-xs text-gray-500 mt-2">
                      Duration: {message.duration_seconds}s
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

