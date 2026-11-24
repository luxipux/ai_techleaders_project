import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "DevMentor",
    template: "%s · DevMentor",
  },
  description: "DevMentor — mentoring for software developers.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-svh">{children}</body>
    </html>
  );
}
