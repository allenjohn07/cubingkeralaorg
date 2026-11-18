import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getDb } from "@/db/client";
import { deleteRequestByWcaid } from "@/db/queries/requests";
import { requireAdmin } from "@/lib/api/auth";
import { createSuccessResponse, createErrorResponse } from "@/lib/api/response";
import { validateRequestBody, wcaIdSchema } from "@/lib/api/validation";

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const authError = await requireAdmin(cookies);
  if (authError) return authError;

  const validation = await validateRequestBody(request, wcaIdSchema);
  if (!validation.success) {
    return createErrorResponse("Invalid request body", 400, { errors: validation.error.issues });
  }

  try {
    const db = getDb(env.DB);
    const deleted = await deleteRequestByWcaid(db, validation.data.wcaid);
    if (!deleted) {
      return createErrorResponse("Request not found", 404);
    }
    return createSuccessResponse({ message: "Request deleted successfully" });
  } catch (error) {
    console.error("delete-request error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
