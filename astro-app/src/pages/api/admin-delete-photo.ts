import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getDb } from "@/db/client";
import { deletePhotoById } from "@/db/queries/photos";
import { requireAdmin } from "@/lib/api/auth";
import { createSuccessResponse, createErrorResponse } from "@/lib/api/response";
import { validateRequestBody, photoDeleteSchema } from "@/lib/api/validation";

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const authError = await requireAdmin(cookies);
  if (authError) return authError;

  const validation = await validateRequestBody(request, photoDeleteSchema);
  if (!validation.success) {
    return createErrorResponse("Invalid request body", 400, { errors: validation.error.issues });
  }
  const { id } = validation.data;

  try {
    const db = getDb(env.DB);
    const path = await deletePhotoById(db, id);
    if (!path) {
      return createErrorResponse("Photo not found", 404);
    }

    await env.MEDIA.delete(path);

    return createSuccessResponse({ message: "Photo deleted" });
  } catch (error) {
    console.error("admin-delete-photo error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
