import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Immigrant Community Hub",
  description:
    "Community, housing, jobs, events and trusted local guidance for newcomers to Canada.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
