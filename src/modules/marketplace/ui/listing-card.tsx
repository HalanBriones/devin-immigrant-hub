import Link from "next/link";
import { AttachmentGallery } from "@/modules/communities/ui/attachment-gallery";
import {
  formatPrice,
  LISTING_CATEGORY_LABELS,
  LISTING_CATEGORY_STYLES,
} from "@/modules/marketplace/categories";
import type { ListingSummary } from "@/modules/marketplace/queries";

export function CategoryBadge({
  category,
}: {
  category: ListingSummary["category"];
}) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${LISTING_CATEGORY_STYLES[category]}`}
    >
      {LISTING_CATEGORY_LABELS[category]}
    </span>
  );
}

export function SellerLine({ listing }: { listing: ListingSummary }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
      <Link
        href={`/u/${listing.sellerHandle}`}
        className="font-medium text-slate-700"
      >
        {listing.sellerName}
      </Link>
      <span>·</span>
      <span>{listing.sellerReputation} reputation</span>
      {listing.sellerVerified ? (
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
          ✓ Verified
        </span>
      ) : null}
    </p>
  );
}

export function ListingCard({ listing }: { listing: ListingSummary }) {
  const price = formatPrice(listing.priceCents, listing.category);
  const place = [listing.cityName, listing.provinceName]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="card card-hover flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <CategoryBadge category={listing.category} />
        {listing.communitySlug ? (
          <Link
            href={`/c/${listing.communitySlug}`}
            className="text-xs font-medium text-sky-700"
          >
            {listing.communityName}
          </Link>
        ) : null}
        <span className="text-xs text-slate-400">
          {listing.createdAt.toLocaleDateString("en-CA", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900">
          <Link href={`/marketplace/${listing.id}`}>{listing.title}</Link>
        </h3>
        {price ? (
          <span className="text-base font-semibold text-slate-900">{price}</span>
        ) : null}
      </div>

      <p className="text-sm text-slate-500">{place}</p>
      <p className="line-clamp-3 text-sm text-slate-700">
        {listing.description}
      </p>

      <AttachmentGallery images={listing.images} alt={listing.title} />

      <SellerLine listing={listing} />
    </article>
  );
}
