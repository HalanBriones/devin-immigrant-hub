import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { logoutAction } from "@/modules/auth/actions";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-6 py-3">
          <Link href="/feed" className="text-sm font-semibold text-sky-700">
            Immigrant Community Hub
          </Link>
          <nav className="flex flex-1 flex-wrap items-center gap-4 text-sm text-slate-600">
            <Link href="/feed">Feed</Link>
            <Link href="/settings/profile">Profile</Link>
            <Link href="/settings/verification">Verification</Link>
            {user.handle ? <Link href={`/u/${user.handle}`}>My public page</Link> : null}
          </nav>
          <form action={logoutAction}>
            <SubmitButton label="Sign out" variant="secondary" />
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
