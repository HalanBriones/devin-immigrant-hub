"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { fieldErrorsOf, type ActionState } from "@/lib/forms";
import { profileInterests, profileLanguages, profiles } from "@/modules/profiles/schema";
import { profileSchema } from "@/modules/profiles/validation";

function optional(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "You must be signed in" };

  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName"),
    handle: formData.get("handle"),
    bio: formData.get("bio") ?? undefined,
    avatarUrl: formData.get("avatarUrl") ?? undefined,
    countryOfOrigin: formData.get("countryOfOrigin") ?? undefined,
    provinceCode: formData.get("provinceCode") ?? undefined,
    cityId: formData.get("cityId") ?? undefined,
    occupation: formData.get("occupation") ?? undefined,
    languages: formData.getAll("languages").map(String),
    interests: formData.getAll("interests").map(String),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsOf(parsed.error) };
  }

  const input = parsed.data;
  const [handleTaken] = await db
    .select({ userId: profiles.userId })
    .from(profiles)
    .where(and(eq(profiles.handle, input.handle), ne(profiles.userId, user.id)))
    .limit(1);
  if (handleTaken) {
    return { fieldErrors: { handle: "That handle is already taken" } };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(profiles)
      .set({
        displayName: input.displayName,
        handle: input.handle,
        bio: optional(input.bio),
        avatarUrl: optional(input.avatarUrl),
        countryOfOrigin: optional(input.countryOfOrigin),
        provinceCode: optional(input.provinceCode),
        cityId: typeof input.cityId === "number" ? input.cityId : null,
        occupation: optional(input.occupation),
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, user.id));

    await tx.delete(profileLanguages).where(eq(profileLanguages.userId, user.id));
    if (input.languages.length > 0) {
      await tx
        .insert(profileLanguages)
        .values(input.languages.map((code) => ({ userId: user.id, languageCode: code })));
    }

    await tx.delete(profileInterests).where(eq(profileInterests.userId, user.id));
    if (input.interests.length > 0) {
      await tx
        .insert(profileInterests)
        .values(input.interests.map((id) => ({ userId: user.id, interestId: id })));
    }
  });

  revalidatePath(`/u/${input.handle}`);
  revalidatePath("/feed");
  return { success: "Profile saved" };
}
