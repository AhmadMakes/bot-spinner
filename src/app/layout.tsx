import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bot Spinner · AI Receptionist Dashboard",
  description:
    "Route multiple businesses through one Twilio number, capture transcripts, and turn every call into leads.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const hasSession =
    cookieStore.get("sb-access-token") ||
    cookieStore.get("supabase-auth-token") ||
    (process.env.NEXT_PUBLIC_SUPABASE_URL &&
      cookieStore.get(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL.split("//")[1]}-auth-token`));

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-slate-950 text-slate-50 antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-white/10 bg-black/40 px-6 py-4 backdrop-blur">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Link href="/" className="font-semibold tracking-wide text-lg text-emerald-300">
                Bot Spinner
              </Link>
              <nav className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
                <Link href="/" className="underline-offset-4 hover:text-white hover:underline">
                  Overview
                </Link>
                <Link
                  href="/dashboard/bots"
                  className="underline-offset-4 hover:text-white hover:underline"
                >
                  Bots
                </Link>
                <Link
                  href="/dashboard/calls"
                  className="underline-offset-4 hover:text-white hover:underline"
                >
                  Calls
                </Link>
                <Link
                  href="/dashboard/leads"
                  className="underline-offset-4 hover:text-white hover:underline"
                >
                  Leads
                </Link>
                {hasSession ? (
                  <form action="/login/logout" className="inline">
                    <button
                      type="submit"
                      className="rounded-full border border-white/30 px-4 py-1 text-xs font-semibold text-white transition hover:border-white/80"
                    >
                      Log out
                    </button>
                  </form>
                ) : (
                  <Link
                    href="/login"
                    className="rounded-full border border-white/30 px-4 py-1 text-xs font-semibold text-white transition hover:border-white/80"
                  >
                    Log in
                  </Link>
                )}
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
