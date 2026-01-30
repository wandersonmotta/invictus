-- Email assets bucket for authentication emails (password reset)
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-assets', 'email-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for email images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Email assets are publicly accessible'
  ) THEN
    CREATE POLICY "Email assets are publicly accessible"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'email-assets');
  END IF;
END
$$;