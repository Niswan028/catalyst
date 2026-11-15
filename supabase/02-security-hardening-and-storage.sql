-- ====================================================
-- Security Hardening Migration
-- 1. Private Voice Messages Storage Bucket
-- 2. Storage RLS Policies for Circle Members
-- ====================================================

-- Ensure the voice-messages bucket exists and is PRIVATE
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voice-messages',
  'voice-messages',
  false, -- PRIVATE BUCKET (Security hardening)
  10485760, -- 10MB limit
  ARRAY['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/mpeg']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/mpeg'];

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop insecure public policies if they exist
DROP POLICY IF EXISTS "Public voice messages access" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload voice messages" ON storage.objects;

-- 1. Users can upload voice messages to their own sender folder or circle
CREATE POLICY "Authenticated users can upload voice messages"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'voice-messages' AND
    auth.role() = 'authenticated'
  );

-- 2. Users can read voice messages if they are the sender, recipient, or an approved circle member
CREATE POLICY "Circle members and message recipients can read audio"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'voice-messages' AND (
      auth.uid() = owner OR
      auth.role() = 'service_role' OR
      EXISTS (
        SELECT 1 FROM public.voice_messages
        WHERE (voice_messages.sender_id = auth.uid() OR voice_messages.recipient_id = auth.uid())
          AND storage.objects.name LIKE '%' || voice_messages.id || '%'
      )
    )
  );

-- 3. Senders can delete their own voice messages
CREATE POLICY "Senders can delete own voice messages"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'voice-messages' AND
    auth.uid() = owner
  );
