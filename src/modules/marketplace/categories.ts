export const LISTING_CATEGORIES = [
  "housing",
  "jobs",
  "buy_sell",
  "services",
] as const;

export type ListingCategory = (typeof LISTING_CATEGORIES)[number];

export const LISTING_CATEGORY_LABELS: Record<ListingCategory, string> = {
  housing: "Housing",
  jobs: "Jobs",
  buy_sell: "Buy & sell",
  services: "Services",
};

export const LISTING_CATEGORY_STYLES: Record<ListingCategory, string> = {
  housing: "border-emerald-200 bg-emerald-50 text-emerald-700",
  jobs: "border-sky-200 bg-sky-50 text-sky-700",
  buy_sell: "border-amber-200 bg-amber-50 text-amber-800",
  services: "border-violet-200 bg-violet-50 text-violet-700",
};

export const MAX_LISTING_IMAGES = 4;

const KNOWN = new Set<string>(LISTING_CATEGORIES);

export function asListingCategory(value: string): ListingCategory | null {
  return KNOWN.has(value) ? (value as ListingCategory) : null;
}

export function formatPrice(
  priceCents: number | null,
  category: ListingCategory,
): string | null {
  if (priceCents === null) return null;
  const amount = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: priceCents % 100 === 0 ? 0 : 2,
  }).format(priceCents / 100);
  return category === "housing" ? `${amount}/month` : amount;
}
