import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";

const pillars = [
  {
    title: "Trusted community",
    body: "Email and phone verified members, reputation built on helpfulness — not follower counts.",
  },
  {
    title: "Communities that fit you",
    body: "Connect by country of origin, language, province or city, and shared interests.",
  },
  {
    title: "Practical daily value",
    body: "Housing, jobs, buy & sell, local services and events — all in one place.",
  },
];

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">Canada</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Immigrant Community Hub
        </h1>
        <p className="max-w-2xl text-lg text-slate-600">
          One place to settle in Canada: community support, housing and job listings, local
          events, and guidance from people who arrived before you.
        </p>
        <div className="flex flex-wrap gap-3">
          {user ? (
            <Link
              href="/feed"
              className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-700"
            >
              Go to your feed
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-700"
              >
                Create your account
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {pillars.map((pillar) => (
          <article
            key={pillar.title}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <h2 className="text-sm font-semibold text-slate-900">{pillar.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{pillar.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
