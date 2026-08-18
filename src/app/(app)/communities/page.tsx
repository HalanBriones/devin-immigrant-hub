import { getCurrentUser } from "@/lib/auth/session";
import { listCommunities } from "@/modules/communities/queries";
import { CommunityCard } from "@/modules/communities/ui/community-card";
import { CreateCommunityForm } from "@/modules/communities/ui/create-community-form";
import { SignUpPrompt } from "@/modules/communities/ui/sign-up-prompt";

export default async function CommunitiesPage() {
  const user = await getCurrentUser();
  const communities = await listCommunities(user?.id ?? null);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Communities</h1>
          <p className="text-sm text-slate-600">
            Join by province, city, country of origin or topic. Posts from communities you join show
            up in your feed.
          </p>
        </div>
        <a
          href={user ? "#create" : "/register"}
          className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-sky-700"
        >
          Start a community
        </a>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {communities.map((community) => (
          <CommunityCard key={community.id} community={community} signedIn={Boolean(user)} />
        ))}
      </section>

      <div id="create" className="scroll-mt-20">
        {user ? <CreateCommunityForm /> : <SignUpPrompt action="join or start a community" />}
      </div>
    </div>
  );
}
