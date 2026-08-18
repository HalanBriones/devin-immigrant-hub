import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { eq, gt, sum, and } from "drizzle-orm";
import { db } from "@/db/client";
import { attachments } from "@/modules/attachments/schema";
import { MAX_IMAGE_BYTES, UPLOAD_QUOTA_BYTES, UPLOAD_QUOTA_DAYS } from "@/lib/upload-limits";

export const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "var", "uploads");

export type SavedImage = {
  fileName: string;
  mimeType: string;
  byteSize: number;
};

type ImageFormat = {
  mimeType: string;
  extension: string;
  matches: (bytes: Uint8Array) => boolean;
};

const FORMATS: ImageFormat[] = [
  {
    mimeType: "image/jpeg",
    extension: "jpg",
    matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mimeType: "image/png",
    extension: "png",
    matches: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    mimeType: "image/gif",
    extension: "gif",
    matches: (b) =>
      b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38,
  },
  {
    mimeType: "image/webp",
    extension: "webp",
    matches: (b) =>
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50,
  },
];

const EXTENSIONS = new Set(FORMATS.map((format) => format.extension));

/** Only files whose bytes really are a supported image are accepted — the client mime type is ignored. */
function detectFormat(bytes: Uint8Array): ImageFormat | null {
  if (bytes.length < 12) return null;
  return FORMATS.find((format) => format.matches(bytes)) ?? null;
}

export function isStoredImageName(name: string): boolean {
  const match = /^[0-9a-f-]{36}\.([a-z]+)$/.exec(name);
  return match !== null && EXTENSIONS.has(match[1]);
}

export function imageUrl(fileName: string): string {
  return `/uploads/${fileName}`;
}

export type SaveImagesResult = { images: SavedImage[] } | { error: string };

/** Bytes a user has uploaded inside the rolling quota window. */
export async function uploadedBytes(userId: string): Promise<number> {
  const windowStart = new Date(Date.now() - UPLOAD_QUOTA_DAYS * 24 * 60 * 60_000);
  const [row] = await db
    .select({ total: sum(attachments.byteSize) })
    .from(attachments)
    .where(
      and(eq(attachments.uploadedBy, userId), gt(attachments.createdAt, windowStart)),
    );
  return Number(row?.total ?? 0);
}

export async function saveImages(
  files: File[],
  limit: number,
  userId: string,
): Promise<SaveImagesResult> {
  const present = files.filter((file) => file.size > 0);
  if (present.length === 0) return { images: [] };
  if (present.length > limit) {
    return {
      error: `Attach at most ${limit} ${limit === 1 ? "image" : "images"}`,
    };
  }

  const incoming = present.reduce((total, file) => total + file.size, 0);
  if ((await uploadedBytes(userId)) + incoming > UPLOAD_QUOTA_BYTES) {
    return {
      error: `Upload quota reached (${UPLOAD_QUOTA_BYTES / (1024 * 1024)} MB per ${UPLOAD_QUOTA_DAYS} days). Try again later.`,
    };
  }

  const saved: SavedImage[] = [];
  await mkdir(UPLOAD_DIR, { recursive: true });

  for (const file of present) {
    if (file.size > MAX_IMAGE_BYTES) {
      return {
        error: `Each image must be smaller than ${MAX_IMAGE_BYTES / (1024 * 1024)} MB`,
      };
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const format = detectFormat(bytes);
    if (!format) return { error: "Images must be JPEG, PNG, GIF or WebP" };

    const fileName = `${randomUUID()}.${format.extension}`;
    await writeFile(path.join(UPLOAD_DIR, fileName), bytes);
    saved.push({
      fileName,
      mimeType: format.mimeType,
      byteSize: bytes.byteLength,
    });
  }

  return { images: saved };
}
