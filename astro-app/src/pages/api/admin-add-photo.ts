import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getDb } from "@/db/client";
import { createPhoto } from "@/db/queries/photos";
import { requireAdmin } from "@/lib/api/auth";
import { createSuccessResponse, createErrorResponse } from "@/lib/api/response";
import { photoUploadMetaSchema } from "@/lib/api/validation";
import { mediaUrl } from "@/config/media";

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Admin-only: uploads a new homepage gallery photo. Multipart form data
// (not JSON) since it carries a real file — `file` (the image) + `alt`
// (required caption text). Uploads to the same R2 bucket/`images/` prefix
// every other media asset already lives under (see Phase 8 migration),
// then records it in the new Photos table so the homepage can read the
// gallery from D1 instead of a hardcoded array.
export const POST: APIRoute = async ({ request, cookies }) => {
  const authError = await requireAdmin(cookies);
  if (authError) return authError;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return createErrorResponse("Expected multipart form data", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return createErrorResponse("An image file is required", 400);
  }

  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    return createErrorResponse("Only JPEG, PNG, or WebP images are allowed", 400);
  }
  if (file.size === 0 || file.size > MAX_FILE_BYTES) {
    return createErrorResponse("Image must be under 8MB", 400);
  }

  const metaValidation = photoUploadMetaSchema.safeParse({ alt: formData.get("alt") });
  if (!metaValidation.success) {
    return createErrorResponse("Invalid request", 400, { errors: metaValidation.error.issues });
  }
  const { alt } = metaValidation.data;

  try {
    const id = crypto.randomUUID();
    const path = `images/gallery/${id}.${extension}`;

    await env.MEDIA.put(path, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });

    const db = getDb(env.DB);
    await createPhoto(db, { id, path, alt });

    return createSuccessResponse({ id, alt, url: mediaUrl(path) }, 201);
  } catch (error) {
    console.error("admin-add-photo error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
