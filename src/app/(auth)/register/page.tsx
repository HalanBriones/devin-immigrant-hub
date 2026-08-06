import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { RegisterForm } from "@/modules/auth/ui/register-form";

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/feed");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">Create your account</h1>
        <p className="mt-1 text-sm text-slate-600">
          Just three fields to start — you can complete your profile after signing in.
        </p>
      </div>
      <RegisterForm />
      <p className="text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-sky-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
