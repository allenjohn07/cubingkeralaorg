import { defineMiddleware } from "astro:middleware";
import { isAdminAccount } from "@/config/admin";
import { readSession, SESSION_COOKIE } from "@/lib/auth/session";

// Ported from the Next.js app's src/middleware.ts. One change: `/_next` →
// `/_astro` (Astro's own build-output path for JS/CSS, the equivalent
// internal-assets prefix).
const VALID_ROUTES = [
  "/competitions",
  "/rankings",
  "/members",
  "/learn",
  "/login",
  "/requests",
  "/sitemap",
  "/unsubscribe",
];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // www and the bare domain both serve identical content with no redirect
  // between them today — real duplicate-content risk (search engines can
  // index both separately, splitting SEO value). cubingkerala.com (no www)
  // is the canonical form used everywhere else in this app (sitemap, OG
  // tags, OAuth redirect computation), so www permanently redirects to it,
  // preserving the full path and query string.
  if (context.url.hostname === "www.cubingkerala.com") {
    const canonicalUrl = new URL(context.url);
    canonicalUrl.hostname = "cubingkerala.com";
    return context.redirect(canonicalUrl.toString(), 301);
  }

  const isHomePage = pathname === "/";
  const isAstroInternal = pathname.startsWith("/_astro");
  const isFile = pathname.includes(".");
  const isApiRoute = pathname.startsWith("/api");
  const isValidRoute = VALID_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"));

  if (!isHomePage && !isAstroInternal && !isValidRoute && !isFile && !isApiRoute) {
    return context.redirect("/");
  }

  if (isApiRoute) {
    const isDirectNavigation =
      context.request.headers.get("sec-fetch-dest") === "document" ||
      context.request.headers.get("accept")?.includes("text/html");

    if (isDirectNavigation) {
      if (pathname === "/api/auth/callback" && context.url.searchParams.get("code")) {
        return next();
      }
      return context.redirect("/");
    }
  }

  const hasSessionCookie = context.cookies.has(SESSION_COOKIE);
  const session = hasSessionCookie ? await readSession(context.cookies) : null;

  if (pathname.startsWith("/requests") && !isAdminAccount(session?.me)) {
    return context.redirect("/");
  }

  // A cookie that's present but fails verification (forged, expired, or a
  // pre-signing session from before signing existed) is dropped, so the
  // visitor is cleanly logged out instead of carrying it around. Pages render
  // it as logged out either way, since every reader verifies the signature
  // itself. (worker.ts strips Set-Cookie from its cacheable page routes, so
  // in practice the deletion lands on the next non-page request, e.g. an
  // API call or the login redirect — fine, correctness never depends on it.)
  if (hasSessionCookie && !session) {
    context.cookies.delete(SESSION_COOKIE, { path: "/" });
  }
  return next();
});
