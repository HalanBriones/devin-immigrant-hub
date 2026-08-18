import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { logoutAction } from "@/modules/auth/actions";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-x-4 px-4 py-3 sm:px-6">
          <Link
            href="/feed"
            className="flex shrink-0 items-center gap-2 text-sm font-semibold tracking-tight text-slate-900"
          >
            <span className="grid size-7 place-items-center rounded-lg bg-sky-600 text-xs font-bold text-white">
              ICH
            </span>
            <span className="hidden lg:inline">Immigrant Community Hub</span>
          </Link>
          <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap text-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link href="/feed" className="nav-link">
              Feed
            </Link>
            <Link href="/communities" className="nav-link">
              Communities
            </Link>
            <Link href="/events" className="nav-link">
              Events
            </Link>
            <Link href="/marketplace" className="nav-link">
              Marketplace
            </Link>
            {user ? (
              <>
                <Link
                  href={user.handle ? `/u/${user.handle}` : "/onboarding"}
                  className="nav-link"
                >
                  Profile
                </Link>
                <Link href="/settings/verification" className="nav-link">
                  Verification
                </Link>
              </>
            ) : null}
          </nav>
          {user ? (
            <form action={logoutAction} className="shrink-0">
              <SubmitButton label="Sign out" variant="secondary" />
            </form>
          ) : (
            <div className="flex shrink-0 items-center gap-2 text-sm">
              <Link href="/login" className="nav-link">
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-sky-600 px-3 py-1.5 font-medium text-white transition-colors hover:bg-sky-700"
              >
                Create account
              </Link>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
