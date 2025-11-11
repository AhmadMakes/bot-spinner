import Link from 'next/link';
import { listRecentCalls } from '@/lib/supabase/calls';
import { createSupabaseServerComponentClient } from '@/lib/supabase/clients';

const dtf = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const formatPhone = (value?: string | null) => {
  if (!value) return 'Unknown';
  const cleaned = value.replace(/[^\d]/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return value;
};

const badgeClass = (status: string) => {
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold';
  switch (status) {
    case 'completed':
      return `${base} bg-emerald-500/20 text-emerald-300`;
    case 'failed':
      return `${base} bg-rose-500/20 text-rose-300`;
    case 'in_progress':
      return `${base} bg-amber-500/20 text-amber-300`;
    default:
      return `${base} bg-slate-500/20 text-slate-200`;
  }
};

export default async function CallsPage() {
  const supabase = await createSupabaseServerComponentClient();
  const calls = await listRecentCalls(supabase, 50);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <header className="border-b border-white/10 bg-black/40 px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-300/80">Dashboard</p>
          <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
            <h1 className="text-3xl font-semibold">Recent Calls</h1>
            <p className="text-sm text-slate-400">
              Showing {calls.length} most recent entries (live Supabase data)
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 shadow-2xl shadow-black/40">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-slate-900/70 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left">Time</th>
                <th className="px-4 py-3 text-left">Bot</th>
                <th className="px-4 py-3 text-left">Caller</th>
                <th className="px-4 py-3 text-left">Routing</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Intent</th>
                <th className="px-4 py-3 text-left">Urgency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {calls.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-slate-400">
                    No calls logged yet. Point your Twilio webhook at the Express server to start
                    filling this view.
                  </td>
                </tr>
              )}

              {calls.map((call) => (
                <tr key={call.id} className="hover:bg-white/5 transition">
                  <td className="px-4 py-3 text-slate-200">
                    <Link
                      href={`/dashboard/calls/${call.id}`}
                      className="text-emerald-200 underline-offset-2 hover:text-emerald-100 hover:underline"
                    >
                      {dtf.format(new Date(call.startedAt))}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-100">{call.botName ?? 'Unknown bot'}</td>
                  <td className="px-4 py-3">
                    <div className="text-slate-100">{formatPhone(call.fromNumber)}</div>
                    <p className="text-xs text-slate-500">→ {formatPhone(call.toNumber)}</p>
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-200">{call.routedVia ?? 'n/a'}</td>
                  <td className="px-4 py-3">
                    <span className={badgeClass(call.status)}>{call.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-200">{call.intent ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-200">{call.urgency ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
