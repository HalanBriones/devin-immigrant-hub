import Link from "next/link";
import { SubmitButton } from "@/components/ui/submit-button";
import { joinCommunityAction, leaveCommunityAction } from "@/modules/communities/actions";
import type { CommunitySummary } from "@/modules/communities/queries";
import { CommunityTags } from "@/modules/communities/ui/community-tags";

const KIND_LABELS: Record<CommunitySummary["kind"], string> = {
  province: "Province",
  city: "City",
  origin: "Country of origin",
  topic: "Topic",
};

export function MembershipButton({
  communityId,
  joined,
  signedIn,
}: {
  communityId: number;
  joined: boolean;
  signedIn: boolean;
}) {
  if (!signedIn) {
    return (
      <Link
        href="/register"
        className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-sky-700"
      >
        Join
      </Link>
    );
  }
  return (
    <form action={joined ? leaveCommunityAction : joinCommunityAction}>
      <input type="hidden" name="communityId" value={communityId} />
      <SubmitButton label={joined ? "Leave" : "Join"} variant={joined ? "secondary" : "primary"} />
    </form>
  );
}

export function CommunityCard({
  community,
  signedIn,
}: {
  community: CommunitySummary;
  signedIn: boolean;
}) {
  return (
    <article className="card card-hover flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            href={`/c/${community.slug}`}
            className="text-sm font-semibold text-slate-900 hover:text-sky-700"
          >
            {community.name}
          </Link>
          <p className="section-title mt-1">{KIND_LABELS[community.kind]}</p>
        </div>
        <MembershipButton
          communityId={community.id}
          joined={community.joined}
          signedIn={signedIn}
        />
      </div>
      {community.description ? (
        <p className="text-sm leading-relaxed text-slate-600">{community.description}</p>
      ) : null}
      <CommunityTags tags={community.tags} />
      <p className="text-xs text-slate-500">
        {community.memberCount} members · {community.postCount} posts
      </p>
    </article>
  );
}
