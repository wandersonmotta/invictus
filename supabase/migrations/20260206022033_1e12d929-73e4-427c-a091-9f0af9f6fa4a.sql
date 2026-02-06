-- Create storage bucket for reward images
INSERT INTO storage.buckets (id, name, public) VALUES ('reward-images', 'reward-images', true);

-- Public read policy
CREATE POLICY "Public read reward images" ON storage.objects
  FOR SELECT USING (bucket_id = 'reward-images');