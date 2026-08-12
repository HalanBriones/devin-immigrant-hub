import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getCommunityBySlug, listCommunityPosts } from "@/modules/communities/queries";
import { MembershipButton } from "@/modules/communities/ui/community-card";
import { InviteShare } from "@/modules/communities/ui/invite-share";
import { PostCard } from "@/modules/communities/ui/post-card";
import { PostComposer } from "@/modules/communities/ui/post-composer";
import { SignUpPrompt } from "@/modules/communities/ui/sign-up-prompt";

export default async function CommunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ invite?: string }>;
}) {
  const { slug } = await params;
  const { invite } = await searchParams;
  const user = await getCurrentUser();
  const community = await getCommunityBySlug(slug, user?.id ?? null);
  if (!community) notFound();

  const posts = await listCommunityPosts(community.id, user?.id ?? null);

  return (
    <div className="flex flex-col gap-6">
      <header className="card flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{community.name}</h1>
          {community.description ? (
            <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
              {community.description}
            </p>
          ) : null}
          <p className="text-xs text-slate-500">
            {community.memberCount} members · {community.postCount} posts
          </p>
        </div>
        <MembershipButton
          communityId={community.id}
          joined={community.joined}
          signedIn={Boolean(user)}
        />
      </header>

      {invite && !community.joined ? (
        <p className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
          You were invited to {community.name}.{" "}
          {user ? "Join to post, comment and see it in your feed." : "Create a free account to join in."}
        </p>
      ) : null}

      {!user ? (
        <SignUpPrompt action="join this community and post" />
      ) : community.joined ? (
        <PostComposer communityId={community.id} />
      ) : (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
          Join this community to post and comment.
        </p>
      )}

      <InviteShare slug={community.slug} communityName={community.name} />

      <section className="flex flex-col gap-4">
        {posts.length === 0 ? (
          <p className="text-sm text-slate-500">No posts yet — be the first to share something.</p>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              signedIn={Boolean(user)}
              showCommunity={false}
            />
          ))
        )}
      </section>
    </div>
  );
}
