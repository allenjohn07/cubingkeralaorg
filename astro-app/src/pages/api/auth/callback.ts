import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getDb } from "@/db/client";
import { findOrCreateUser } from "@/db/queries/users";
import { createErrorResponse } from "@/lib/api/response";

// Ported from src/app/api/auth/callback/route.ts, with two deliberate
// changes: the old app also set an `authToken` httpOnly cookie (the raw WCA
// bearer token) alongside `userInfo` — grep confirmed it was never read
// back anywhere in that codebase, so it's dropped here rather than carried
// forward as dead weight. And `userInfo` is now httpOnly itself (the old
// app's version, and this one's until now, wasn't) — every real auth check
// (middleware.ts, requireAuth/requireAdmin) already reads it server-side
// only, and the one client-side reader (useAuth, in Navbar) has been
// replaced with a server-computed isLoggedIn prop from Layout.astro, so
// nothing actually needed JS access to this cookie's contents.
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get("code");
  if (!code) return redirect("/");

  try {
    const redirectUri = `${url.origin}/api/auth/callback`;

    const tokenResponse = await fetch("https://www.worldcubeassociation.org/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: env.CLIENT_ID,
        client_secret: env.CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code,
      }),
    });
    if (!tokenResponse.ok) {
      return createErrorResponse("Failed to exchange code for token", 500);
    }
    const { access_token, token_type } = (await tokenResponse.json()) as {
      access_token: string;
      token_type: string;
    };

    const userInfoResponse = await fetch("https://www.worldcubeassociation.org/api/v0/me", {
      headers: { Authorization: `${token_type} ${access_token}` },
    });
    if (!userInfoResponse.ok) {
      return createErrorResponse("Failed to fetch WCA profile", 500);
    }
    const userInfo = (await userInfoResponse.json()) as {
      me: { wca_id: string; name: string; avatar: { url: string }; country: { name: string }; gender: string };
    };

    const db = getDb(env.DB);
    await findOrCreateUser(db, {
      wcaid: userInfo.me.wca_id,
      name: userInfo.me.name,
      avatarUrl: userInfo.me.avatar.url,
      country: userInfo.me.country.name,
      gender: userInfo.me.gender,
    });

    // The session's lifetime is ours, not WCA's: the access token is only
    // used for the /me fetch above and never again, so its (short) expires_in
    // has nothing to do with how long the visitor should stay logged in.
    // Tying the cookie to it logged people out mid-browse, which looked
    // exactly like the navbar "forgetting" the login.
    cookies.set("userInfo", JSON.stringify(userInfo), {
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
      httpOnly: true,
      sameSite: "lax", // must survive the top-level redirect back from WCA's OAuth server
      secure: url.protocol === "https:",
    });

    // Belt-and-braces only. Pages are never reused from the browser cache
    // without revalidating (worker.ts's forBrowser()), so a page cached
    // while logged out can't be shown after this login regardless.
    // Clear-Site-Data used to be the only guard against that, and it was
    // not reliable (browser support for "cache" is patchy). The unique
    // query param likewise just guarantees a fresh fetch of the landing
    // page; Layout.astro strips it from the address bar right after load.
    const response = redirect(`/?__fresh=${Date.now()}`);
    response.headers.set("Clear-Site-Data", '"cache"');
    return response;
  } catch (error) {
    console.error("Auth callback error:", error);
    return createErrorResponse("Failed to exchange code for token", 500);
  }
};
