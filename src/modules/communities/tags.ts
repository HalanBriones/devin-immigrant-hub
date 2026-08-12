export const COMMUNITY_TAGS = [
  "guidance",
  "housing",
  "jobs",
  "food",
  "events",
  "education",
  "health",
  "legal",
  "language",
  "transport",
  "money",
  "social",
] as const;

export type CommunityTag = (typeof COMMUNITY_TAGS)[number];

export const COMMUNITY_TAG_LABELS: Record<CommunityTag, string> = {
  guidance: "Guidance",
  housing: "Housing",
  jobs: "Jobs",
  food: "Food",
  events: "Events",
  education: "Education",
  health: "Health",
  legal: "Legal",
  language: "Language",
  transport: "Transport",
  money: "Money",
  social: "Social",
};

export const MAX_COMMUNITY_TAGS = 5;

const KNOWN = new Set<string>(COMMUNITY_TAGS);

export function asCommunityTags(values: string[]): CommunityTag[] {
  return values.filter((value): value is CommunityTag => KNOWN.has(value));
}
