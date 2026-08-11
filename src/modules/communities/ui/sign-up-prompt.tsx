import Link from "next/link";

export function SignUpPrompt({ action }: { action: string }) {
  return (
    <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
      <Link href="/register" className="font-medium text-sky-700">
        Create a free account
      </Link>{" "}
      to {action}, or{" "}
      <Link href="/login" className="font-medium text-sky-700">
        sign in
      </Link>
      .
    </p>
  );
}
