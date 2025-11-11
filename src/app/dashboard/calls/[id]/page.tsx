import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCallDetail } from '@/lib/supabase/calls';
import { createSupabaseServerComponentClient } from '@/lib/supabase/clients';

const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeStyle: 'long',
  }).format(new Date(iso));

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
    <h2 className="text-lg font-semibold text-white">{title}</h2>
    <div className="mt-3 text-sm text-slate-200">{children}</div>
  </section>
);

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerComponentClient();
  const call = await getCallDetail(supabase, id);

  if (!call) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <header className="border-b border-white/10 bg-black/40 px-6 py-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-2">
          <Link
            href="/dashboard/calls"
            className="text-sm text-slate-400 underline-offset-4 hover:text-slate-200 hover:underline"
          >
            ← Back to calls
          </Link>
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-emerald-300/80">Call Detail</p>
            <h1 className="text-3xl font-semibold">{call.botName ?? 'Unknown bot'}</h1>
            <p className="text-sm text-slate-400">{formatDateTime(call.startedAt)}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
        <Section title="Metadata">
          <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div>
              <dt className="text-slate-400">Caller</dt>
              <dd className="font-mono text-slate-100">{call.fromNumber ?? 'Unknown'}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Destination</dt>
              <dd className="font-mono text-slate-100">{call.toNumber ?? 'Unknown'}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Routing</dt>
              <dd className="capitalize text-slate-100">{call.routedVia ?? 'n/a'}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Status</dt>
              <dd className="text-slate-100">{call.status}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Intent</dt>
              <dd className="text-slate-100">{call.intent ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Urgency</dt>
              <dd className="text-slate-100">{call.urgency ?? '—'}</dd>
            </div>
          </dl>
        </Section>

        <Section title="Transcript">
          {call.transcript ? (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Source: {call.transcriptSource ?? 'unknown'}{' '}
                {call.transcriptCapturedAt
                  ? `· ${new Date(call.transcriptCapturedAt).toLocaleString()}`
                  : ''}
              </p>
              <p className="whitespace-pre-line text-slate-100">{call.transcript}</p>
            </div>
          ) : (
            <p className="text-slate-400">No transcript captured yet.</p>
          )}
        </Section>

        <Section title="Summary">
          {call.summary ? (
            <p className="whitespace-pre-line text-slate-100">{call.summary}</p>
          ) : (
            <p className="text-slate-400">Summary will appear once Gemini processes the call.</p>
          )}
        </Section>

        <Section title="Lead JSON">
          {call.leadJson ? (
            <pre className="overflow-auto rounded-lg bg-black/50 p-4 text-xs text-emerald-200">
              {JSON.stringify(call.leadJson, null, 2)}
            </pre>
          ) : (
            <p className="text-slate-400">No structured lead captured yet.</p>
          )}
        </Section>

        <Section title="Raw Payload">
          <pre className="overflow-auto rounded-lg bg-black/50 p-4 text-xs text-slate-200">
            {JSON.stringify(call.rawPayload ?? {}, null, 2)}
          </pre>
        </Section>
      </main>
    </div>
  );
}
