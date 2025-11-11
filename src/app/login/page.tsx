"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { signIn, type SignInState } from "./actions";

const initialState: SignInState = {};

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/40"
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
};

export default function LoginPage() {
  const params = useSearchParams();
  const redirectTo = params.get("redirectTo") ?? "/dashboard/calls";
  const [state, setState] = useState(initialState);

  const formAction = async (formData: FormData) => {
    const result = await signIn(state, formData);
    if (result?.error) {
      setState(result);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-50">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-white/5 bg-slate-900/80 p-8 shadow-2xl shadow-black/40">
        <div className="space-y-2 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-300/80">Bot Spinner</p>
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-sm text-slate-400">
            Use the credentials provisioned in Supabase Auth. Sign-ups are disabled for this app.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <div className="space-y-1">
            <label htmlFor="email" className="text-sm text-slate-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-base text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm text-slate-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-base text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30"
              placeholder="••••••••"
            />
          </div>

          {state?.error && (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {state.error}
            </p>
          )}

          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
