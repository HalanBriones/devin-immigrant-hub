import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import {
  getProfileByUserId,
  listCities,
  listInterests,
  listLanguages,
  listProvinces,
} from "@/modules/profiles/queries";
import { ProfileForm } from "@/modules/profiles/ui/profile-form";

export async function ProfileFormLoader({ submitLabel }: { submitLabel?: string }) {
  const user = await requireUser();
  const [profile, provinces, cities, languages, interests] = await Promise.all([
    getProfileByUserId(user.id),
    listProvinces(),
    listCities(),
    listLanguages(),
    listInterests(),
  ]);

  if (!profile) notFound();

  return (
    <ProfileForm
      profile={profile}
      submitLabel={submitLabel}
      options={{
        provinces: provinces.map((province) => ({
          code: province.code,
          nameEn: province.nameEn,
        })),
        cities,
        languages: languages.map((language) => ({
          code: language.code,
          nameEn: language.nameEn,
        })),
        interests: interests.map((interest) => ({ id: interest.id, nameEn: interest.nameEn })),
      }}
    />
  );
}
