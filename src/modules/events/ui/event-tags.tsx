import { EVENT_TAG_LABELS, type EventTag } from "@/modules/events/tags";

export function EventTags({ tags }: { tags: EventTag[] }) {
  if (tags.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <li
          key={tag}
          className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700"
        >
          {EVENT_TAG_LABELS[tag]}
        </li>
      ))}
    </ul>
  );
}
