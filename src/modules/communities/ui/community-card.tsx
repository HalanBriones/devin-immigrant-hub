import Link from "next/link";
import { SubmitButton } from "@/components/ui/submit-button";
import { joinCommunityAction, leaveCommunityAction } from "@/modules/communities/actions";
import type { CommunitySummary } from "@/modules/communities/queries";

const KIND_LABELS: Record<CommunitySummary["kind"], string> = {
  province: "Province",
  city: "City",
  origin: "Country of origin",
  topic: "Topic",
};

export function MembershipButton({
  communityId,
  joined,
}: {
  communityId: number;
  joined: boolean;
}) {
  return (
    <form action={joined ? leaveCommunityAction : joinCommunityAction}>
      <input type="hidden" name="communityId" value={communityId} />
      <SubmitButton label={joined ? "Leave" : "Join"} variant={joined ? "secondary" : "primary"} />
    </form>
  );
}

export function CommunityCard({ community }: { community: CommunitySummary }) {
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
        <MembershipButton communityId={community.id} joined={community.joined} />
      </div>
      {community.description ? (
        <p className="text-sm leading-relaxed text-slate-600">{community.description}</p>
      ) : null}
      <p className="text-xs text-slate-500">
        {community.memberCount} members · {community.postCount} posts
      </p>
    </article>
  );
}
