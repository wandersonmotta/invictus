import { supabase } from "@/integrations/supabase/client";

export async function createSignedUrl(bucket: string, path: string, expiresInSeconds = 60 * 60) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}
