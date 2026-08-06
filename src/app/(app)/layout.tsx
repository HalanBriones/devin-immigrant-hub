import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { logoutAction } from "@/modules/auth/actions";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3">
          <Link
            href="/feed"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-900"
          >
            <span className="grid size-7 place-items-center rounded-lg bg-sky-600 text-xs font-bold text-white">
              ICH
            </span>
            Immigrant Community Hub
          </Link>
          <nav className="flex flex-1 flex-wrap items-center gap-1 text-sm">
            <Link href="/feed" className="nav-link">
              Feed
            </Link>
            <Link href="/settings/profile" className="nav-link">
              Profile
            </Link>
            <Link href="/settings/verification" className="nav-link">
              Verification
            </Link>
            {user.handle ? (
              <Link href={`/u/${user.handle}`} className="nav-link">
                My public page
              </Link>
            ) : null}
          </nav>
          <form action={logoutAction}>
            <SubmitButton label="Sign out" variant="secondary" />
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
