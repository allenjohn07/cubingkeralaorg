import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getDb } from "@/db/client";
import { createMember } from "@/db/queries/members";
import { deleteRequestByWcaid } from "@/db/queries/requests";
import { requireAdmin } from "@/lib/api/auth";
import { createSuccessResponse, createErrorResponse } from "@/lib/api/response";
import { validateRequestBody, requestInfoSchema } from "@/lib/api/validation";
import { syncSingleMemberWcaData } from "@/lib/wca/sync";

// Ported from src/app/api/approve-requests/route.ts. The background
// syncSingleMemberWcaData(wcaid) call uses locals.cfContext.waitUntil —
// Cloudflare's equivalent of Next's after() — so it doesn't block the
// response the admin is waiting on.
export const POST: APIRoute = async ({ request, cookies, locals }) => {
  const authError = await requireAdmin(cookies);
  if (authError) return authError;

  const validation = await validateRequestBody(request, requestInfoSchema);
  if (!validation.success) {
    return createErrorResponse("Request is required and must include wcaid and name", 400, {
      errors: validation.error.issues,
    });
  }

  const { wcaid, name, avatarUrl, country, gender, role } = validation.data;

  try {
    const db = getDb(env.DB);
    await createMember(db, {
      wcaid,
      name,
      avatarUrl: avatarUrl ?? "",
      country: country ?? "",
      gender: gender ?? "",
      role: role ?? "member",
    });
    await deleteRequestByWcaid(db, wcaid);

    locals.cfContext.waitUntil(syncSingleMemberWcaData(db, wcaid));

    return createSuccessResponse({ message: "Request updated successfully" });
  } catch (error) {
    console.error("approve-requests error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
