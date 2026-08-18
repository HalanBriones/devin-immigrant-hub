import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { listCommunities } from "@/modules/communities/queries";
import { CreateListingForm } from "@/modules/marketplace/ui/create-listing-form";
import { listCities, listProvinces } from "@/modules/profiles/queries";

export default async function NewListingPage() {
  await requireUser();
  const [provinces, cities, communities] = await Promise.all([
    listProvinces(),
    listCities(),
    listCommunities(null),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <Link href="/marketplace" className="text-xs font-medium text-sky-700">
          ← Back to marketplace
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Post a listing</h1>
        <p className="text-sm text-slate-600">
          Housing, a job opening, something to sell or a service you offer. Your
          reputation and verification badges are shown to buyers.
        </p>
      </header>
      <CreateListingForm
        options={{
          provinces: provinces.map((province) => ({
            code: province.code,
            nameEn: province.nameEn,
          })),
          cities,
          communities: communities.map((community) => ({
            id: community.id,
            name: community.name,
          })),
        }}
      />
    </div>
  );
}
