'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/clients';

export async function updateLeadStatusAction(formData: FormData) {
  const leadId = formData.get('leadId')?.toString();
  const nextStatus = formData.get('status')?.toString();

  if (!leadId || !nextStatus) {
    return { error: 'Missing lead id or status' };
  }

  const supabase = createSupabaseServiceRoleClient();

  const { error } = await supabase.from('leads').update({ status: nextStatus }).eq('id', leadId);

  if (error) {
    console.error('Failed to update lead status', error);
    return { error: 'Unable to update status' };
  }

  revalidatePath('/dashboard/leads');
  return { success: true };
}
