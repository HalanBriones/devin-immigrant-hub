import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { MAX_IMAGE_BYTES } from "@/lib/upload-limits";

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

export async function saveImages(
  files: File[],
  limit: number,
): Promise<SaveImagesResult> {
  const present = files.filter((file) => file.size > 0);
  if (present.length === 0) return { images: [] };
  if (present.length > limit) {
    return {
      error: `Attach at most ${limit} ${limit === 1 ? "image" : "images"}`,
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
