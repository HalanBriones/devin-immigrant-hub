"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db/client";
import { requireUser } from "@/lib/auth/session";
import { fieldErrorsOf, type ActionState } from "@/lib/forms";
import { saveImages } from "@/lib/uploads";
import { attachments } from "@/modules/attachments/schema";
import {
  LISTING_CATEGORIES,
  MAX_LISTING_IMAGES,
} from "@/modules/marketplace/categories";
import { listings } from "@/modules/marketplace/schema";

const optionalNumber = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : Number(value)))
  .refine((value) => value === null || Number.isInteger(value), {
    message: "Pick a valid option",
  });

const listingSchema = z.object({
  category: z.enum(LISTING_CATEGORIES, { message: "Pick a category" }),
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(140),
  description: z
    .string()
    .trim()
    .min(20, "Describe the listing in at least 20 characters")
    .max(5000),
  price: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : Number(value)))
    .refine((value) => value === null || (Number.isFinite(value) && value >= 0), {
      message: "Price must be a positive number",
    }),
  provinceCode: z.string().trim().length(2, "Pick a province"),
  cityId: optionalNumber,
  communityId: optionalNumber,
  contactEmail: z.union([
    z.literal(""),
    z.string().trim().email("Enter a valid email"),
  ]),
  contactPhone: z.string().trim().max(40),
});

function imageFiles(formData: FormData): File[] {
  return formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File);
}

export async function createListingAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const values = {
    category: String(formData.get("category") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    price: String(formData.get("price") ?? ""),
    provinceCode: String(formData.get("provinceCode") ?? ""),
    cityId: String(formData.get("cityId") ?? ""),
    communityId: String(formData.get("communityId") ?? ""),
    contactEmail: String(formData.get("contactEmail") ?? ""),
    contactPhone: String(formData.get("contactPhone") ?? ""),
  };
  const parsed = listingSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsOf(parsed.error), values };
  }
  if (!parsed.data.contactEmail && !parsed.data.contactPhone) {
    return {
      fieldErrors: { contactEmail: "Add an email or a phone number" },
      values,
    };
  }

  const uploads = await saveImages(imageFiles(formData), MAX_LISTING_IMAGES, user.id);
  if ("error" in uploads) return { error: uploads.error, values };

  let listingId = 0;
  await db.transaction(async (tx) => {
    const [listing] = await tx
      .insert(listings)
      .values({
        sellerId: user.id,
        category: parsed.data.category,
        title: parsed.data.title,
        description: parsed.data.description,
        priceCents:
          parsed.data.price === null
            ? null
            : Math.round(parsed.data.price * 100),
        provinceCode: parsed.data.provinceCode,
        cityId: parsed.data.cityId,
        communityId: parsed.data.communityId,
        contactEmail: parsed.data.contactEmail || null,
        contactPhone: parsed.data.contactPhone || null,
      })
      .returning({ id: listings.id });
    listingId = listing.id;

    if (uploads.images.length > 0) {
      await tx
        .insert(attachments)
        .values(
          uploads.images.map((image) => ({
            ...image,
            listingId: listing.id,
            uploadedBy: user.id,
          })),
        );
    }
  });

  revalidatePath("/marketplace");
  redirect(`/marketplace/${listingId}`);
}

async function setStatus(
  formData: FormData,
  status: "active" | "closed",
): Promise<void> {
  const user = await requireUser();
  const listingId = Number(formData.get("listingId"));
  if (!Number.isInteger(listingId)) return;

  await db
    .update(listings)
    .set({ status })
    .where(and(eq(listings.id, listingId), eq(listings.sellerId, user.id)));

  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/${listingId}`);
}

export async function closeListingAction(formData: FormData): Promise<void> {
  await setStatus(formData, "closed");
}

export async function reopenListingAction(formData: FormData): Promise<void> {
  await setStatus(formData, "active");
}
