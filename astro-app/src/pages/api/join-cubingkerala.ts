import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getDb } from "@/db/client";
import { getMemberByWcaid } from "@/db/queries/members";
import { getRequestByWcaid, createRequest } from "@/db/queries/requests";
import { requireAuth, verifyAuth } from "@/lib/api/auth";
import { createSuccessResponse, createErrorResponse } from "@/lib/api/response";

// Deliberate contract change from the old Next.js route: that one took the
// user's info as a client-POSTed body, trusting the client to accurately
// describe itself (requireAuth only checked that *some* valid session
// existed, not that the posted body matched it). This reads identity from
// the signed, verified session cookie instead — no body needed, and a
// user can only ever request membership as themselves.
export const POST: APIRoute = async ({ cookies }) => {
  const authError = await requireAuth(cookies);
  if (authError) return authError;

  const { user } = await verifyAuth(cookies);
  const wcaid = user?.me?.wca_id;
  if (!user || !wcaid) {
    return createErrorResponse("Invalid session", 400);
  }

  try {
    const db = getDb(env.DB);

    const existingRequest = await getRequestByWcaid(db, wcaid);
    if (existingRequest) {
      return createErrorResponse("Request already submitted", 400);
    }

    const existingMember = await getMemberByWcaid(db, wcaid);
    if (existingMember) {
      return createErrorResponse("Already a member", 400);
    }

    await createRequest(db, {
      wcaid,
      name: user.me.name,
      avatarUrl: user.me.avatar.url,
      country: user.me.country.name,
      gender: user.me.gender,
      role: "member",
    });

    return createSuccessResponse({ message: "Request submitted successfully" });
  } catch (error) {
    console.error("join-cubingkerala error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
