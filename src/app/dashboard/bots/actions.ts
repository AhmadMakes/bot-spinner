'use server';

import { Buffer } from 'node:buffer';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerActionClient, createSupabaseServiceRoleClient } from '@/lib/supabase/clients';
import { uploadToKnowledgeBucket } from '@/lib/supabase/storage';
import { ensureFileSearchStore, uploadDocumentToStore } from '@/lib/gemini/file-search';

export type UploadState = {
  error?: string;
  success?: string;
};

const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 MB to stay under serverless limits

export async function uploadKnowledgeFileAction(
  prevState: UploadState,
  formData: FormData
): Promise<UploadState> {
  const botId = formData.get('botId')?.toString();
  const file = formData.get('file') as File | null;

  if (!botId) {
    return { error: 'Missing bot id.' };
  }

  if (!file || file.size === 0) {
    return { error: 'Please select a file.' };
  }

  if (file.size > MAX_FILE_BYTES) {
    return { error: 'File size must be under 10 MB.' };
  }

  const authClient = await createSupabaseServerActionClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return { error: 'You must be signed in.' };
  }

  const { data: membership } = await authClient
    .from('bot_members')
    .select('bot_id')
    .eq('bot_id', botId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return { error: 'You do not have access to this bot.' };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const storagePath = `${botId}/${Date.now()}-${file.name}`;

  const serviceClient = createSupabaseServiceRoleClient();

  let botStore = null;
  const { data: bot } = await serviceClient
    .from('bots')
    .select('id,file_search_store_id')
    .eq('id', botId)
    .maybeSingle();

  try {
    botStore = await ensureFileSearchStore(botId, bot?.file_search_store_id ?? undefined);
    if (!bot?.file_search_store_id) {
      await serviceClient.from('bots').update({ file_search_store_id: botStore }).eq('id', botId);
    }
  } catch (error) {
    console.error('Failed to ensure Gemini store', error);
    return { error: (error as Error).message ?? 'Unable to set up Gemini File Search store.' };
  }

  const { error: insertError, data: kbRecord } = await serviceClient
    .from('kb_files')
    .insert({
      bot_id: botId,
      storage_path: storagePath,
      status: 'processing',
      mime_type: file.type || 'application/octet-stream',
      size_bytes: file.size,
    })
    .select()
    .single();

  if (insertError || !kbRecord) {
    console.error('Failed to insert kb record', insertError);
    return { error: 'Unable to record file metadata.' };
  }

  try {
    await uploadToKnowledgeBucket(buffer, storagePath, file.type || 'application/octet-stream');
    const geminiFileId = await uploadDocumentToStore({
      storeName: botStore!,
      buffer: arrayBuffer,
      filename: file.name,
      mimeType: file.type,
    });

    await serviceClient
      .from('kb_files')
      .update({ status: 'ready', gemini_file_id: geminiFileId })
      .eq('id', kbRecord.id);

    revalidatePath('/dashboard/bots');
    return { success: 'File uploaded and indexed.' };
  } catch (error) {
    console.error('Failed to upload KB file', error);
    await serviceClient
      .from('kb_files')
      .update({ status: 'failed', error_message: (error as Error).message })
      .eq('id', kbRecord.id);
    return { error: (error as Error).message ?? 'Upload failed. Check the file format and try again.' };
  }
}
