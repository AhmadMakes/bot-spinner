import type { SupabaseClient } from '@supabase/supabase-js';

export type LeadRecord = {
  id: string;
  callId: string | null;
  botId: string | null;
  name: string | null;
  phone: string | null;
  reason: string | null;
  urgency: string | null;
  nextStep: string | null;
  status: string;
  createdAt: string;
  callStartedAt: string | null;
  intent: string | null;
};

type DbLead = {
  id: string;
  call_id: string | null;
  bot_id: string | null;
  name: string | null;
  phone: string | null;
  reason: string | null;
  urgency: string | null;
  next_step: string | null;
  status: string;
  created_at: string;
  calls: { started_at: string | null; intent: string | null }[] | null;
};

export const listLeads = async (
  supabase: SupabaseClient,
  limit = 50
): Promise<LeadRecord[]> => {
  const { data, error } = await supabase
    .from('leads')
    .select(
      `
      id,
      call_id,
      bot_id,
      name,
      phone,
      reason,
      urgency,
      next_step,
      status,
      created_at,
      calls (started_at, intent)
    `
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch leads', error);
    return [];
  }

  return (data as DbLead[]).map((lead) => ({
    id: lead.id,
    callId: lead.call_id,
    botId: lead.bot_id,
    name: lead.name,
    phone: lead.phone,
    reason: lead.reason,
    urgency: lead.urgency,
    nextStep: lead.next_step,
    status: lead.status,
    createdAt: lead.created_at,
    callStartedAt: lead.calls?.[0]?.started_at ?? null,
    intent: lead.calls?.[0]?.intent ?? null,
  }));
};

export const updateLeadStatus = async (
  supabase: SupabaseClient,
  leadId: string,
  status: string
) => {
  await supabase.from('leads').update({ status }).eq('id', leadId);
};
