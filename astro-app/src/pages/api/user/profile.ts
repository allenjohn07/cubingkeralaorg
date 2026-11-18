import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getDb } from "@/db/client";
import { getMemberByWcaid } from "@/db/queries/members";
import { getUserProfileFields, updateUserProfile } from "@/db/queries/users";
import { requireAuth, verifyAuth } from "@/lib/api/auth";
import { createSuccessResponse, createErrorResponse } from "@/lib/api/response";
import { validateRequestBody, userProfileUpdateSchema } from "@/lib/api/validation";

export const GET: APIRoute = async ({ cookies }) => {
  const authError = await requireAuth(cookies);
  if (authError) return authError;

  const { user } = await verifyAuth(cookies);
  const wcaid = user?.me?.wca_id;
  if (!wcaid) return createErrorResponse("Invalid session", 400);

  try {
    const db = getDb(env.DB);
    const [member, profile] = await Promise.all([getMemberByWcaid(db, wcaid), getUserProfileFields(db, wcaid)]);

    return createSuccessResponse({
      isMember: !!member,
      email: profile?.email ?? null,
      emailConsent: profile?.emailConsent ?? false,
    });
  } catch (error) {
    console.error("user/profile GET error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};

export const PATCH: APIRoute = async ({ request, cookies }) => {
  const authError = await requireAuth(cookies);
  if (authError) return authError;

  const { user } = await verifyAuth(cookies);
  const wcaid = user?.me?.wca_id;
  if (!wcaid) return createErrorResponse("Invalid session", 400);

  const validation = await validateRequestBody(request, userProfileUpdateSchema);
  if (!validation.success) {
    return createErrorResponse("Invalid request body", 400, { errors: validation.error.issues });
  }

  try {
    const db = getDb(env.DB);
    const updated = await updateUserProfile(db, wcaid, validation.data);
    if (!updated) return createErrorResponse("User not found", 404);
    return createSuccessResponse(updated);
  } catch (error) {
    console.error("user/profile PATCH error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
