import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceRoleClient } from '@/lib/supabase/clients';
import { buildTwiMLResponse, parseTwilioFormBody } from '@/lib/twilio/helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const payload = await parseTwilioFormBody(req);
  const supabase = createSupabaseServiceRoleClient();
  const twilioSid = payload.CallSid;
  const transcript = (payload.SpeechResult || payload.Digits || '').trim();

  if (twilioSid && transcript) {
    const { data: call, error: callError } = await supabase
      .from('calls')
      .select('id')
      .eq('twilio_sid', twilioSid)
      .maybeSingle();

    if (callError) {
      console.error('Unable to find call for transcript', callError);
    } else if (call) {
      const { error: insertError } = await supabase.from('call_transcripts').insert({
        call_id: call.id,
        transcript,
        source: 'twilio_gather',
      });

      if (insertError) {
        console.error('Failed to insert transcript', insertError);
      }
    }
  }

  const twiml = buildTwiMLResponse(
    [
      '<Say voice="Polly.Joanna">Thanks for sharing that information. Our team will reach out shortly.</Say>',
      '<Hangup/>',
    ].join('')
  );

  return new NextResponse(twiml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}
