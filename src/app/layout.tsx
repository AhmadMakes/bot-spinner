import type { Metadata } from "next";
import Link from "next/link";
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

const navLinks = [
  { href: "/", label: "Overview" },
  { href: "/dashboard/calls", label: "Calls" },
  { href: "/dashboard/leads", label: "Leads" },
  { href: "/login", label: "Login" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
              <nav className="flex flex-wrap gap-4 text-sm text-slate-300">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="underline-offset-4 hover:text-white hover:underline"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
