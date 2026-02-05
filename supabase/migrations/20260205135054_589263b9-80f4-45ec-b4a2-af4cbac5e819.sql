-- Create storage bucket for recognition award images
INSERT INTO storage.buckets (id, name, public)
VALUES ('recognition-awards', 'recognition-awards', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to recognition award images
CREATE POLICY "Public can view recognition awards"
ON storage.objects FOR SELECT
USING (bucket_id = 'recognition-awards');

-- Allow authenticated users to upload (for admin generation)
CREATE POLICY "Authenticated users can upload recognition awards"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'recognition-awards' AND auth.role() = 'authenticated');