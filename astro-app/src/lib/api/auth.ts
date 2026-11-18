import type { AstroCookies } from "astro";
import { isAdminAccount } from "@/config/admin";
import { readSession, type SessionUser } from "@/lib/auth/session";

export type { SessionUser };

/** Verifies the signed session cookie (see src/lib/auth/session.ts). */
export async function verifyAuth(cookies: AstroCookies): Promise<{
  isAuthenticated: boolean;
  user?: SessionUser;
}> {
  const user = await readSession(cookies);
  return user ? { isAuthenticated: true, user } : { isAuthenticated: false };
}

/** Returns a 401 Response if not authenticated, otherwise null (caller proceeds). */
export async function requireAuth(cookies: AstroCookies): Promise<Response | null> {
  const { isAuthenticated } = await verifyAuth(cookies);
  if (!isAuthenticated) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}

/** Logged-in admin only. Use on approve / update / delete member-request routes. */
export async function requireAdmin(cookies: AstroCookies): Promise<Response | null> {
  const { isAuthenticated, user } = await verifyAuth(cookies);
  if (!isAuthenticated) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!isAdminAccount(user?.me)) {
    return new Response(JSON.stringify({ message: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}
