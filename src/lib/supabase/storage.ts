import { Buffer } from 'node:buffer';
import { createSupabaseServiceRoleClient } from './clients';

export const uploadToKnowledgeBucket = async (
  buffer: Buffer,
  filename: string,
  contentType: string | null
) => {
  const supabase = createSupabaseServiceRoleClient();
  const bucket = process.env.SUPABASE_KB_BUCKET ?? 'bot-kb';

  const { data, error } = await supabase.storage.from(bucket).upload(filename, buffer, {
    contentType: contentType || 'application/octet-stream',
    upsert: false,
  });

  if (error) {
    throw error;
  }

  return { path: data.path };
};
