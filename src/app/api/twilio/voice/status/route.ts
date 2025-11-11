import { NextRequest, NextResponse } from 'next/server';
import { generateCallSummary } from '@/lib/gemini/summaries';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/clients';
import { parseTwilioFormBody } from '@/lib/twilio/helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const payload = await parseTwilioFormBody(req);
  const supabase = createSupabaseServiceRoleClient();

  const twilioSid = payload.CallSid;
  const callStatus = payload.CallStatus ?? 'unknown';

  if (!twilioSid) {
    return NextResponse.json({ ok: true });
  }

  const { data: call, error } = await supabase
    .from('calls')
    .select('id, bot_id, from_number')
    .eq('twilio_sid', twilioSid)
    .maybeSingle();

  if (error || !call) {
    console.error('Unable to load call for summary', error);
    return NextResponse.json({ ok: true });
  }

  await supabase.from('calls').update({ status: callStatus }).eq('id', call.id);

  if (callStatus !== 'completed') {
    return NextResponse.json({ ok: true });
  }

  const { data: transcriptRow } = await supabase
    .from('call_transcripts')
    .select('transcript')
    .eq('call_id', call.id)
    .order('created_at', { ascending: false })
    .maybeSingle();

  if (!transcriptRow?.transcript) {
    return NextResponse.json({ ok: true });
  }

  try {
    const summary = await generateCallSummary(transcriptRow.transcript);

    if (summary) {
      await supabase
        .from('call_summaries')
        .upsert(
          {
            call_id: call.id,
            summary: summary.summary,
            intent: summary.intent,
            urgency: summary.urgency,
            lead_json: summary.lead ?? null,
          },
          { onConflict: 'call_id' }
        )
        .select()
        .maybeSingle();

      await supabase.from('leads').upsert(
        {
          call_id: call.id,
          bot_id: call.bot_id ?? process.env.DEFAULT_BOT_ID,
          name: summary.lead?.name ?? null,
          phone: summary.lead?.phone ?? call.from_number,
          reason: summary.lead?.reason ?? null,
          urgency: summary.urgency ?? null,
          next_step: summary.lead?.next_step ?? null,
          status: summary.lead?.needs_follow_up === false ? 'closed' : 'new',
        },
        { onConflict: 'call_id' }
      );
    }
  } catch (err) {
    console.error('Gemini summary failed', err);
  }

  return NextResponse.json({ ok: true });
}
