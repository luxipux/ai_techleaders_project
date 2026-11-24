import { Separator } from "@devmentor/ui/components/separator";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: { default: "Backend", template: "%s · DevMentor Backend" },
  robots: { index: false, follow: false },
};

/** Backend (admin) shell. Backend pages are composed from shadcn-ui components (`@devmentor/ui`). */
export default function BackendLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="bg-muted/40 flex min-h-svh flex-col">
      <header className="bg-background">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-6">
          <Link href="/backend" className="font-semibold">
            DevMentor <span className="text-muted-foreground font-normal">Backend</span>
          </Link>
          <Separator orientation="vertical" className="h-5!" />
          <nav className="text-muted-foreground flex gap-4 text-sm">
            <Link href="/backend" className="hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/" className="hover:text-foreground">
              View site
            </Link>
          </nav>
        </div>
        <Separator />
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
