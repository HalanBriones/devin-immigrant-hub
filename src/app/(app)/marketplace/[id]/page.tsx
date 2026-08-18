import Link from "next/link";
import { notFound } from "next/navigation";
import { SubmitButton } from "@/components/ui/submit-button";
import { getCurrentUser } from "@/lib/auth/session";
import { AttachmentGallery } from "@/modules/communities/ui/attachment-gallery";
import { SignUpPrompt } from "@/modules/communities/ui/sign-up-prompt";
import {
  closeListingAction,
  reopenListingAction,
} from "@/modules/marketplace/actions";
import { formatPrice } from "@/modules/marketplace/categories";
import { getListing } from "@/modules/marketplace/queries";
import { CategoryBadge, SellerLine } from "@/modules/marketplace/ui/listing-card";
import { ReportButton } from "@/modules/moderation/ui/report-button";

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listingId = Number(id);
  if (!Number.isInteger(listingId)) notFound();

  const [user, listing] = await Promise.all([
    getCurrentUser(),
    getListing(listingId),
  ]);
  if (!listing) notFound();

  const price = formatPrice(listing.priceCents, listing.category);
  const place = [listing.cityName, listing.provinceName]
    .filter(Boolean)
    .join(", ");
  const owned = user?.handle === listing.sellerHandle;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/marketplace" className="text-xs font-medium text-sky-700">
        ← Back to marketplace
      </Link>

      <article className="card flex flex-col gap-4">
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
          {listing.status === "closed" ? (
            <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              Closed
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {listing.title}
          </h1>
          {price ? (
            <span className="text-xl font-semibold text-slate-900">{price}</span>
          ) : null}
        </div>

        <p className="text-sm text-slate-600">
          {place} · posted{" "}
          {listing.createdAt.toLocaleDateString("en-CA", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>

        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
          {listing.description}
        </p>

        <AttachmentGallery
          images={listing.images}
          alt={`Photo for ${listing.title}`}
        />
      </article>

      <section className="card flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-900">Seller</h2>
        <SellerLine listing={listing} />
        {user && user.emailVerified ? (
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {listing.contactEmail ? (
              <div>
                <dt className="text-slate-500">Email</dt>
                <dd className="font-medium">
                  <a
                    href={`mailto:${listing.contactEmail}`}
                    className="text-sky-700"
                  >
                    {listing.contactEmail}
                  </a>
                </dd>
              </div>
            ) : null}
            {listing.contactPhone ? (
              <div>
                <dt className="text-slate-500">Phone</dt>
                <dd className="font-medium">
                  <a href={`tel:${listing.contactPhone}`} className="text-sky-700">
                    {listing.contactPhone}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        ) : user ? (
          <p className="text-sm text-slate-600">
            Verify your email to see the seller&apos;s contact details.{" "}
            <Link
              href={user.handle ? `/u/${user.handle}#verification` : "/onboarding"}
              className="font-medium text-sky-700"
            >
              Verify now
            </Link>
          </p>
        ) : (
          <SignUpPrompt action="see the seller's contact details" />
        )}

        {owned ? (
          <form
            action={
              listing.status === "active"
                ? closeListingAction
                : reopenListingAction
            }
          >
            <input type="hidden" name="listingId" value={listing.id} />
            <SubmitButton
              label={
                listing.status === "active"
                  ? "Mark as closed"
                  : "Reopen listing"
              }
              variant="secondary"
            />
          </form>
        ) : null}

        {user && !owned ? (
          <ReportButton targetType="listing" targetId={listing.id} />
        ) : null}
      </section>
    </div>
  );
}
