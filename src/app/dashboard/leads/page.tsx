import Link from 'next/link';
import { listLeads } from '@/lib/supabase/leads';
import { createSupabaseServerComponentClient } from '@/lib/supabase/clients';
import { updateLeadStatusAction } from './actions';

const urgencyBadge = (urgency?: string | null) => {
  const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold';
  switch (urgency) {
    case 'high':
      return `${base} bg-rose-500/20 text-rose-300`;
    case 'medium':
      return `${base} bg-amber-500/20 text-amber-300`;
    case 'low':
    default:
      return `${base} bg-slate-500/20 text-slate-200`;
  }
};

export default async function LeadsPage() {
  const supabase = await createSupabaseServerComponentClient();
  const leads = await listLeads(supabase, 100);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <header className="border-b border-white/10 bg-black/40 px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-300/80">Dashboard</p>
          <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
            <h1 className="text-3xl font-semibold">Leads</h1>
            <p className="text-sm text-slate-400">{leads.length} recent entries</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 shadow-2xl shadow-black/40">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-slate-900/70 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="px-4 py-3 text-left">Caller</th>
                <th className="px-4 py-3 text-left">Reason</th>
                <th className="px-4 py-3 text-left">Intent</th>
                <th className="px-4 py-3 text-left">Urgency</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-slate-400">
                    No leads yet. Once Gemini summaries run, new leads will show up here.
                  </td>
                </tr>
              )}

              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-white/5 transition">
                  <td className="px-4 py-3 text-slate-200">
                    {new Date(lead.createdAt).toLocaleString()}
                    {lead.callId && (
                      <div>
                        <Link
                          href={`/dashboard/calls/${lead.callId}`}
                          className="text-xs text-emerald-300 underline-offset-2 hover:text-emerald-100 hover:underline"
                        >
                          View call
                        </Link>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-100">{lead.name ?? 'Unknown'}</div>
                    <p className="text-xs text-slate-400">{lead.phone ?? 'No number'}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-200">{lead.reason ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-200">{lead.intent ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={urgencyBadge(lead.urgency)}>{lead.urgency ?? 'low'}</span>
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-200">{lead.status}</td>
                  <td className="px-4 py-3">
                    <form action={updateLeadStatusAction} className="flex items-center gap-2">
                      <input type="hidden" name="leadId" value={lead.id} />
                      <select
                        name="status"
                        defaultValue={lead.status}
                        className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs text-white"
                        onChange={(e) => e.currentTarget.form?.requestSubmit()}
                      >
                        <option value="new">new</option>
                        <option value="contacted">contacted</option>
                        <option value="closed">closed</option>
                        <option value="ignored">ignored</option>
                      </select>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
