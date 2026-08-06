import { z } from "zod";

export const profileSchema = z.object({
  displayName: z.string().trim().min(2, "Display name is too short").max(60),
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]{3,24}$/, "Use 3-24 lowercase letters, numbers or hyphens"),
  bio: z.string().trim().max(600, "Keep your bio under 600 characters").optional(),
  avatarUrl: z.union([z.string().trim().url("Enter a valid image URL"), z.literal("")]).optional(),
  countryOfOrigin: z
    .union([z.string().trim().toUpperCase().length(2, "Select a country"), z.literal("")])
    .optional(),
  provinceCode: z
    .union([z.string().trim().toUpperCase().length(2, "Select a province"), z.literal("")])
    .optional(),
  cityId: z.union([z.coerce.number().int().positive(), z.literal("")]).optional(),
  occupation: z.string().trim().max(80).optional(),
  languages: z.array(z.string().trim()).max(10),
  interests: z.array(z.coerce.number().int().positive()).max(15),
});

export type ProfileInput = z.infer<typeof profileSchema>;
