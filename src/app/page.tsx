import Link from "next/link";

const steps = [
  {
    title: "Connect Twilio",
    description: "Point your number’s Voice + Status callbacks to /api/twilio/voice and /voice/status.",
  },
  {
    title: "Route Calls",
    description: "One shared number greets callers, captures transcripts, and logs every call in Supabase.",
  },
  {
    title: "Review Leads",
    description: "Gemini summarizes conversations, tags intent/urgency, and drops structured leads into the dashboard.",
  },
];

const highlights = [
  "One Twilio number, unlimited bots.",
  "Supabase stores calls, transcripts, summaries, and leads with RLS.",
  "Gemini 2.5 Flash powers FAQ responses + post-call insights.",
  "Next.js dashboard on Vercel with protected routes and live data.",
];

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-10 shadow-2xl shadow-emerald-900/30">
        <p className="text-sm uppercase tracking-[0.35em] text-emerald-300/80">One-Number AI Receptionist</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">
          Turn every inbound call into a transcript, summary, and actionable lead.
        </h1>
        <p className="mt-4 text-lg text-slate-300">
          Bot Spinner lets multiple businesses share a single Twilio line. Each caller is routed to the right bot,
          answered with their knowledge base, and synced into Supabase with Gemini-generated insights.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/login"
            className="rounded-full bg-emerald-400/90 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-300"
          >
            Sign in to Dashboard
          </Link>
          <Link
            href="/dashboard/calls"
            className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/80"
          >
            View Calls
          </Link>
        </div>
        <div className="mt-8 grid gap-3 text-sm text-slate-200 md:grid-cols-2">
          {highlights.map((item) => (
            <div key={item} className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {steps.map((step, index) => (
          <div key={step.title} className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Step {index + 1}</p>
            <h3 className="mt-3 text-lg font-semibold text-white">{step.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{step.description}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
        <h3 className="text-lg font-semibold text-white">How to get started</h3>
        <ol className="mt-4 space-y-4 text-sm text-slate-200">
          <li>
            <span className="font-semibold text-emerald-200">1.</span> Create a Supabase project, run{" "}
            <code className="rounded bg-black/50 px-2 py-1 text-xs">supabase db push</code> with{" "}
            <code className="text-xs">supabase/migrations/0001_init.sql</code>, and seed a bot/user.
          </li>
          <li>
            <span className="font-semibold text-emerald-200">2.</span> Add your environment variables (Supabase, Gemini,
            Twilio) in Vercel → Project Settings → Environment Variables.
          </li>
          <li>
            <span className="font-semibold text-emerald-200">3.</span> Point your Twilio number’s Voice webhook to{" "}
            <code className="text-xs">/api/twilio/voice</code> and Status callback to <code className="text-xs">/api/twilio/voice/status</code>.
          </li>
          <li>
            <span className="font-semibold text-emerald-200">4.</span> Call the number, then review transcripts under{" "}
            <Link href="/dashboard/calls" className="underline">
              Calls
            </Link>{" "}
            and Gemini-generated leads under{" "}
            <Link href="/dashboard/leads" className="underline">
              Leads
            </Link>
            .
          </li>
        </ol>
        <p className="mt-6 text-sm text-slate-400">
          Need implementation notes? The original planning docs live at{" "}
          <a className="underline" href="/mvp-plan.md">
            /mvp-plan.md
          </a>{" "}
          (plus Gemini docs alongside the repo).
        </p>
      </section>
    </div>
  );
}
