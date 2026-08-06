import Link from "next/link";
import { redirect } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "@/modules/auth/ui/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  if (await getCurrentUser()) redirect("/feed");
  const { reset } = await searchParams;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-600">Sign in to your community.</p>
      </div>
      {reset ? <Alert tone="success">Your password was updated — sign in again.</Alert> : null}
      <LoginForm />
      <div className="flex justify-between text-sm text-slate-600">
        <Link href="/forgot-password" className="font-medium text-sky-700">
          Forgot password?
        </Link>
        <Link href="/register" className="font-medium text-sky-700">
          Create account
        </Link>
      </div>
    </div>
  );
}
