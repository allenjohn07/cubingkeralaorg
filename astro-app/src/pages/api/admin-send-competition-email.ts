import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getDb } from "@/db/client";
import { getCompetitionById } from "@/db/queries/competitions";
import { sendCompetitionAnnouncement } from "@/lib/email/send-competition-email";
import { requireAdmin } from "@/lib/api/auth";
import { createSuccessResponse, createErrorResponse } from "@/lib/api/response";
import { validateRequestBody, sendCompetitionEmailSchema } from "@/lib/api/validation";

export const POST: APIRoute = async ({ request, cookies }) => {
  const authError = await requireAdmin(cookies);
  if (authError) return authError;

  const validation = await validateRequestBody(request, sendCompetitionEmailSchema);
  if (!validation.success) {
    return createErrorResponse("Invalid request body", 400, { errors: validation.error.issues });
  }
  const { competitionId, message } = validation.data;

  try {
    const db = getDb(env.DB);
    const competition = await getCompetitionById(db, competitionId);
    if (!competition) {
      return createErrorResponse("Competition not found", 404);
    }

    const { sent } = await sendCompetitionAnnouncement(db, competition, message);
    return createSuccessResponse({ message: `Sent to ${sent} member${sent === 1 ? "" : "s"}`, sent });
  } catch (error) {
    console.error("admin-send-competition-email error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};
