import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getDb } from "@/db/client";
import { getMemberByWcaid, createMember } from "@/db/queries/members";
import { upsertMemberWcaData } from "@/db/queries/wca-data";
import { fetchWcaPersonData } from "@/lib/wca/sync";
import { requireAdmin } from "@/lib/api/auth";
import { createSuccessResponse, createErrorResponse } from "@/lib/api/response";
import { validateRequestBody, adminAddMemberSchema } from "@/lib/api/validation";

// Admin-only: add a member directly by WCA ID, skipping the request/approve
// flow entirely. Everything beyond the ID itself (name, avatar, country,
// gender) and their WCA competitor data (personal_records, medals,
// competition_count — i.e. what powers rankings) comes from one live WCA
// API call, same endpoint/SSRF-safe lookup the sync job uses.
export const POST: APIRoute = async ({ request, cookies }) => {
  const authError = await requireAdmin(cookies);
  if (authError) return authError;

  const validation = await validateRequestBody(request, adminAddMemberSchema);
  if (!validation.success) {
    return createErrorResponse("Invalid request body", 400, { errors: validation.error.issues });
  }
  const { wcaid, role } = validation.data;

  try {
    const db = getDb(env.DB);

    const existing = await getMemberByWcaid(db, wcaid);
    if (existing) {
      return createErrorResponse("Already a member", 400);
    }

    const wcaData = await fetchWcaPersonData(wcaid);
    if (!wcaData) {
      return createErrorResponse("Could not find that WCA ID on the WCA website", 404);
    }

    await createMember(db, {
      wcaid,
      name: wcaData.person.name,
      avatarUrl: wcaData.person.avatar.url,
      country: wcaData.person.country.name,
      gender: wcaData.person.gender,
      role,
    });

    // Populate MemberWcaData immediately too — no need to wait for the
    // daily cron before this person's rankings/personal records show up.
    await upsertMemberWcaData(db, wcaid, wcaData);

    return createSuccessResponse({ message: "Member added successfully", name: wcaData.person.name });
  } catch (error) {
    console.error("admin-add-member error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
