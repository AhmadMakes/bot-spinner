const checklist = [
  'Fill out .env.local using the template in the repo root.',
  'Run both dev servers: `npm run dev` (Next.js) and `npm run dev:server` (Express).',
  'Point Twilio Voice webhook to http://localhost:4000/twilio/voice for the stubbed flow.',
  'Create Supabase schema + policies before wiring real data.',
  'Implement Gemini File Search + Flash prompts for FAQ answers and summaries.',
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <header className="w-full border-b border-white/10 bg-black/50 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-emerald-300/80">
              Bot Spinner MVP
            </p>
            <h1 className="text-2xl font-semibold">One-Number AI Receptionist</h1>
          </div>
          <p className="text-sm text-slate-400">
            Next.js dashboard + Express API + Supabase + Twilio + Gemini
          </p>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-12">
        <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-8 shadow-2xl shadow-emerald-900/20">
          <h2 className="text-xl font-semibold text-emerald-300">Current Status</h2>
          <p className="mt-3 text-base text-slate-300">
            The frontend is running in this Next.js app while the Express API lives in
            <span className="font-mono text-slate-50"> src/server</span>. Start both
            processes locally to access the placeholder Twilio webhook and health check.
            The homepage is intentionally barebones until we hook up Supabase data and the call dashboard UI.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <h3 className="text-lg font-semibold text-white">Bootstrap Checklist</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              {checklist.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/20 text-xs font-semibold text-emerald-300">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
            <h3 className="text-lg font-semibold text-white">Reference Docs</h3>
            <div className="mt-4 space-y-3 text-sm">
              <a
                className="block rounded-xl border border-white/5 bg-black/20 px-4 py-3 transition hover:border-emerald-400/50"
                href="/mvp-plan.md"
              >
                MVP Plan (repo root)
              </a>
              <a
                className="block rounded-xl border border-white/5 bg-black/20 px-4 py-3 transition hover:border-emerald-400/50"
                href="/gemini-file-search-doc.md"
              >
                Gemini File Search Notes
              </a>
              <a
                className="block rounded-xl border border-white/5 bg-black/20 px-4 py-3 transition hover:border-emerald-400/50"
                href="/gemini-live-api.md"
              >
                Gemini Live API Notes
              </a>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          <h3 className="text-lg font-semibold text-white">Next Up</h3>
          <p className="mt-3 text-sm text-slate-300">
            Implement Supabase migrations (bots, calls, transcripts, leads), wire the Express
            webhook to persist Twilio payloads, and surface call data in a dashboard table here.
            Once the plumbing is in place we can integrate Gemini File Search + Flash for FAQ
            answers and summaries, then expand into routing logic and KB uploads.
          </p>
        </section>
      </main>
    </div>
  );
}
