import type { SupabaseClient } from '@supabase/supabase-js';

export type BotWithKnowledge = {
  id: string;
  name: string;
  description: string | null;
  fileSearchStoreId: string | null;
  kbFiles: {
    id: string;
    storagePath: string;
    status: string;
    geminiFileId: string | null;
    uploadedAt: string;
    errorMessage: string | null;
  }[];
};

type BotRow = {
  id: string;
  name: string;
  description: string | null;
  file_search_store_id: string | null;
  kb_files:
    | {
        id: string;
        storage_path: string;
        status: string;
        gemini_file_id: string | null;
        uploaded_at: string;
        error_message: string | null;
      }[]
    | null;
};

export const listBotsWithKnowledge = async (supabase: SupabaseClient): Promise<BotWithKnowledge[]> => {
  const { data, error } = await supabase
    .from('bots')
    .select(
      `
      id,
      name,
      description,
      file_search_store_id,
      kb_files (
        id,
        storage_path,
        status,
        gemini_file_id,
        uploaded_at,
        error_message
      )
    `
    )
    .order('name', { ascending: true });

  if (error || !data) {
    console.error('Failed to fetch bots', error);
    return [];
  }

  return (data as BotRow[]).map((bot) => ({
    id: bot.id,
    name: bot.name,
    description: bot.description,
    fileSearchStoreId: bot.file_search_store_id,
    kbFiles:
      bot.kb_files?.map((file) => ({
        id: file.id,
        storagePath: file.storage_path,
        status: file.status,
        geminiFileId: file.gemini_file_id,
        uploadedAt: file.uploaded_at,
        errorMessage: file.error_message,
      })) ?? [],
  }));
};
