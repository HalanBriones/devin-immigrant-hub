export const POST_TYPES = ["question", "info", "event", "service"] as const;

export type PostType = (typeof POST_TYPES)[number];

export const POST_TYPE_LABELS: Record<PostType, string> = {
  question: "Question",
  info: "Useful info",
  event: "Event",
  service: "Service",
};

export const POST_TYPE_HINTS: Record<PostType, string> = {
  question: "Ask the community for help",
  info: "Share something you learned",
  event: "Something happening at a place and time",
  service: "Offer or recommend a service",
};

export const POST_TYPE_STYLES: Record<PostType, string> = {
  question: "border-sky-200 bg-sky-50 text-sky-700",
  info: "border-emerald-200 bg-emerald-50 text-emerald-700",
  event: "border-violet-200 bg-violet-50 text-violet-700",
  service: "border-amber-200 bg-amber-50 text-amber-800",
};
