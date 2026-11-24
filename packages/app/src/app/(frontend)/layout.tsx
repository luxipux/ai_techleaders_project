import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Frontend (public) shell. Frontend pages are styled with plain Tailwind utilities;
 * shadcn-ui components are reserved for the backend.
 */
export default function FrontendLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-svh flex-col bg-slate-950 text-slate-100">
      <header className="border-b border-white/10">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Dev<span className="text-emerald-400">Mentor</span>
          </Link>
          <Link
            href="/backend"
            className="rounded-md px-3 py-1.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            Backend
          </Link>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-white/10 py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} DevMentor
      </footer>
    </div>
  );
}
