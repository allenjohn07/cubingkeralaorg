import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getDb } from "@/db/client";
import { updateMember } from "@/db/queries/members";
import { requireAdmin } from "@/lib/api/auth";
import { createSuccessResponse, createErrorResponse } from "@/lib/api/response";
import { validateRequestBody, requestInfoSchema } from "@/lib/api/validation";

export const POST: APIRoute = async ({ request, cookies }) => {
  const authError = await requireAdmin(cookies);
  if (authError) return authError;

  const validation = await validateRequestBody(request, requestInfoSchema);
  if (!validation.success) {
    return createErrorResponse("Invalid request body", 400, { errors: validation.error.issues });
  }

  const { wcaid, name, avatarUrl, country, gender, role } = validation.data;

  try {
    const db = getDb(env.DB);
    const updated = await updateMember(db, wcaid, { name, avatarUrl, country, gender, role });
    if (!updated) {
      return createErrorResponse("Error updating the member", 404);
    }
    return createSuccessResponse({ message: "Member updated successfully" });
  } catch (error) {
    console.error("update-members error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
