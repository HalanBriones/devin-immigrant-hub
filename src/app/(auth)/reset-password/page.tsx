import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { ResetPasswordForm } from "@/modules/auth/ui/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold">Choose a new password</h1>
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <Alert tone="error">This reset link is missing its token.</Alert>
      )}
      <Link href="/login" className="text-sm font-medium text-sky-700">
        Back to sign in
      </Link>
    </div>
  );
}
