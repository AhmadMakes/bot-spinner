import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/clients';
import { buildAbsoluteUrl, buildTwiMLResponse, parseTwilioFormBody } from '@/lib/twilio/helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const payload = await parseTwilioFormBody(req);
  const supabase = createSupabaseServiceRoleClient();

  const botId = process.env.DEFAULT_BOT_ID ?? null;
  const twilioSid = payload.CallSid;

  const routedVia = payload.ForwardedFrom
    ? 'forwarded'
    : payload.To
      ? 'direct'
      : 'prompted';

  try {
    const { error } = await supabase
      .from('calls')
      .upsert(
        {
          bot_id: botId,
          twilio_sid: twilioSid,
          from_number: payload.From,
          to_number: payload.To,
          forwarded_from: payload.ForwardedFrom,
          routed_via: routedVia,
          status: 'initiated',
          raw_payload: payload,
        },
        { onConflict: 'twilio_sid' }
      );

    if (error) {
      console.error('Failed to upsert call record', error);
    }
  } catch (err) {
    console.error('Unexpected error creating call record', err);
  }

  const greeting =
    process.env.DEFAULT_BOT_ID && process.env.DEFAULT_BOT_FORWARDING_NUMBER
      ? 'Thanks for calling our shared AI receptionist.'
      : 'Thanks for calling Bot Spinner.';

  const gatherAction = buildAbsoluteUrl(req, '/api/twilio/voice/gather');

  const twiml = buildTwiMLResponse(
    [
      `<Gather input="speech dtmf" action="${gatherAction}" method="POST" speechTimeout="auto" timeout="6">`,
      `<Say voice="Polly.Joanna">${greeting} Please tell us your name and why you are calling.</Say>`,
      '</Gather>',
      '<Say voice="Polly.Joanna">Thanks, someone will follow up shortly.</Say>',
      '<Hangup/>',
    ].join('')
  );

  return new NextResponse(twiml, {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}
