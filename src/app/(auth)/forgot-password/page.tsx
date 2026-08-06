import Link from "next/link";
import { ForgotPasswordForm } from "@/modules/auth/ui/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">Reset your password</h1>
        <p className="mt-1 text-sm text-slate-600">
          We&apos;ll email you a link to choose a new password.
        </p>
      </div>
      <ForgotPasswordForm />
      <Link href="/login" className="text-sm font-medium text-sky-700">
        Back to sign in
      </Link>
    </div>
  );
}
