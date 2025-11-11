import type { SupabaseClient } from '@supabase/supabase-js';

export type CallRecord = {
  id: string;
  botId: string | null;
  botName: string | null;
  fromNumber: string | null;
  toNumber: string | null;
  forwardedFrom: string | null;
  routedVia: string | null;
  status: string;
  intent: string | null;
  urgency: string | null;
  startedAt: string;
};

export type CallDetail = CallRecord & {
  rawPayload: Record<string, unknown> | null;
  transcript: string | null;
  transcriptSource: string | null;
  transcriptCapturedAt: string | null;
  summary: string | null;
  leadJson: Record<string, unknown> | null;
};

type DbCall = {
  id: string;
  bot_id: string | null;
  from_number: string | null;
  to_number: string | null;
  forwarded_from: string | null;
  routed_via: string | null;
  status: string;
  intent: string | null;
  urgency: string | null;
  started_at: string;
  bots: {
    name: string | null;
  } | null;
};

/**
 * Fetches the most recent calls for dashboard views.
 * Pass in an authenticated Supabase client to respect RLS.
 */
export const listRecentCalls = async (
  supabase: SupabaseClient,
  limit = 25
): Promise<CallRecord[]> => {
  const { data, error } = await supabase
    .from('calls')
    .select(
      `
      id,
      bot_id,
      from_number,
      to_number,
      forwarded_from,
      routed_via,
      status,
      intent,
      urgency,
      started_at,
      bots (name)
    `
    )
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch calls', error);
    return [];
  }

  return (data as DbCall[]).map((call) => ({
    id: call.id,
    botId: call.bot_id,
    botName: call.bots?.name ?? null,
    fromNumber: call.from_number,
    toNumber: call.to_number,
    forwardedFrom: call.forwarded_from,
    routedVia: call.routed_via,
    status: call.status,
    intent: call.intent,
    urgency: call.urgency,
    startedAt: call.started_at,
  }));
};

export const getCallDetail = async (
  supabase: SupabaseClient,
  callId: string
): Promise<CallDetail | null> => {
  const { data, error } = await supabase
    .from('calls')
    .select(
      `
      id,
      bot_id,
      from_number,
      to_number,
      forwarded_from,
      routed_via,
      status,
      intent,
      urgency,
      started_at,
      raw_payload,
      bots (name),
      call_transcripts (transcript, created_at, source),
      call_summaries (summary, lead_json)
    `
    )
    .eq('id', callId)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch call detail', error);
    return null;
  }

  if (!data) return null;

  const call = data as DbCall & {
    raw_payload: Record<string, unknown> | null;
    call_transcripts: { transcript: string | null; created_at: string | null; source: string | null }[] | null;
    call_summaries: { summary: string | null; lead_json: Record<string, unknown> | null }[] | null;
  };

  return {
    id: call.id,
    botId: call.bot_id,
    botName: call.bots?.name ?? null,
    fromNumber: call.from_number,
    toNumber: call.to_number,
    forwardedFrom: call.forwarded_from,
    routedVia: call.routed_via,
    status: call.status,
    intent: call.intent,
    urgency: call.urgency,
    startedAt: call.started_at,
    rawPayload: call.raw_payload ?? null,
    transcript: call.call_transcripts?.[0]?.transcript ?? null,
    transcriptSource: call.call_transcripts?.[0]?.source ?? null,
    transcriptCapturedAt: call.call_transcripts?.[0]?.created_at ?? null,
    summary: call.call_summaries?.[0]?.summary ?? null,
    leadJson: call.call_summaries?.[0]?.lead_json ?? null,
  };
};
