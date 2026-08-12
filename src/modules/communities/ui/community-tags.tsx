import {
  COMMUNITY_TAG_LABELS,
  type CommunityTag,
} from "@/modules/communities/tags";

export function CommunityTags({ tags }: { tags: CommunityTag[] }) {
  if (tags.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <li
          key={tag}
          className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600"
        >
          {COMMUNITY_TAG_LABELS[tag]}
        </li>
      ))}
    </ul>
  );
}
