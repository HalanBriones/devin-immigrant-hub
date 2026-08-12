import {
  POST_TYPE_LABELS,
  POST_TYPE_STYLES,
  type PostType,
} from "@/modules/communities/post-types";

export function PostTypeBadge({ type }: { type: PostType }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${POST_TYPE_STYLES[type]}`}
    >
      {POST_TYPE_LABELS[type]}
    </span>
  );
}
