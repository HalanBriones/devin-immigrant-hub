export const EVENT_TAGS = [
  "food",
  "culture",
  "networking",
  "jobs",
  "language",
  "family",
  "sports",
  "outdoors",
  "workshop",
  "volunteering",
  "faith",
  "social",
] as const;

export type EventTag = (typeof EVENT_TAGS)[number];

export const EVENT_TAG_LABELS: Record<EventTag, string> = {
  food: "Food",
  culture: "Culture",
  networking: "Networking",
  jobs: "Jobs",
  language: "Language exchange",
  family: "Family",
  sports: "Sports",
  outdoors: "Outdoors",
  workshop: "Workshop",
  volunteering: "Volunteering",
  faith: "Faith",
  social: "Social",
};

export const MAX_EVENT_TAGS = 5;
export const MAX_EVENT_IMAGES = 4;

const KNOWN = new Set<string>(EVENT_TAGS);

export function asEventTags(values: string[]): EventTag[] {
  return values.filter((value): value is EventTag => KNOWN.has(value));
}
