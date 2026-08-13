import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { isStoredImageName, UPLOAD_DIR } from "@/lib/uploads";
import { attachments } from "@/modules/attachments/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  if (!isStoredImageName(name))
    return new Response("Not found", { status: 404 });

  const [attachment] = await db
    .select({ mimeType: attachments.mimeType })
    .from(attachments)
    .where(eq(attachments.fileName, name))
    .limit(1);
  if (!attachment) return new Response("Not found", { status: 404 });

  const filePath = path.join(UPLOAD_DIR, name);
  try {
    await stat(filePath);
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const file = await readFile(filePath);
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
