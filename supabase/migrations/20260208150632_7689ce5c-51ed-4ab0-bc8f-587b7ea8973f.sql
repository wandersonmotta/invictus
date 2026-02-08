
INSERT INTO storage.buckets (id, name, public) VALUES ('support-assets', 'support-assets', true);

CREATE POLICY "Public read support assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'support-assets');

CREATE POLICY "Service role upload support assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'support-assets');
