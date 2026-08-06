import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 self-start text-sm font-semibold text-slate-700 transition-colors hover:text-sky-700"
      >
        <span aria-hidden>←</span> Immigrant Community Hub
      </Link>
      <div className="card shadow-lg shadow-slate-900/5">{children}</div>
    </div>
  );
}
