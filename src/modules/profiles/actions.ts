"use server";

import { unlink } from "node:fs/promises";
import path from "node:path";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { getCurrentUser } from "@/lib/auth/session";
import { fieldErrorsOf, type ActionState } from "@/lib/forms";
import { imageUrl, saveImages, UPLOAD_DIR } from "@/lib/uploads";
import { attachments } from "@/modules/attachments/schema";
import { profileInterests, profileLanguages, profiles } from "@/modules/profiles/schema";
import { profileSchema } from "@/modules/profiles/validation";

function optional(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

/** Avatars are stored like any other upload, so replacing one frees its row and file. */
async function removeCurrentAvatar(userId: string): Promise<void> {
  const removed = await db
    .delete(attachments)
    .where(eq(attachments.avatarUserId, userId))
    .returning({ fileName: attachments.fileName });

  await Promise.all(
    removed.map((row) =>
      unlink(path.join(UPLOAD_DIR, row.fileName)).catch(() => undefined),
    ),
  );
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

  const avatarFile = formData.get("avatar");
  let avatarUrl: string | null | undefined;
  if (avatarFile instanceof File && avatarFile.size > 0) {
    const uploaded = await saveImages([avatarFile], 1, user.id);
    if ("error" in uploaded) return { fieldErrors: { avatar: uploaded.error } };
    const [image] = uploaded.images;
    await removeCurrentAvatar(user.id);
    await db
      .insert(attachments)
      .values({ ...image, avatarUserId: user.id, uploadedBy: user.id });
    avatarUrl = imageUrl(image.fileName);
  } else if (formData.get("removeAvatar") === "1") {
    await removeCurrentAvatar(user.id);
    avatarUrl = null;
  }

  await db.transaction(async (tx) => {
    await tx
      .update(profiles)
      .set({
        displayName: input.displayName,
        handle: input.handle,
        bio: optional(input.bio),
        ...(avatarUrl === undefined ? {} : { avatarUrl }),
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
