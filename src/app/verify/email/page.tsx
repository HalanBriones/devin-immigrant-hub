import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { verifyEmailToken } from "@/modules/auth/actions";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const verified = token ? await verifyEmailToken(token) : false;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-5 px-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold">Email verification</h1>
        {verified ? (
          <Alert tone="success">
            Your email is verified. Your verified badge is now visible on your profile.
          </Alert>
        ) : (
          <Alert tone="error">
            This verification link is invalid or has expired. Request a new one from your
            verification settings.
          </Alert>
        )}
        <Link href="/settings/verification" className="text-sm font-medium text-sky-700">
          Go to verification settings
        </Link>
      </div>
    </main>
  );
}
