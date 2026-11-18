import { handle } from "@astrojs/cloudflare/handler";
import { getDb } from "./db/client";
import { getAllMemberWcaIds } from "./db/queries/members";
import { syncMemberWcaData } from "./lib/wca/sync";
import { syncCompetitions } from "./lib/competitions/sync";

// Custom Worker entrypoint (replaces @astrojs/cloudflare/entrypoints/server
// as wrangler.jsonc's "main") so we can add a scheduled() export alongside
// Astro's own fetch handler — the adapter has no built-in Cron Trigger
// support, this is the officially documented "custom worker entry file"
// pattern (import handle from @astrojs/cloudflare/handler, export a
// standard ExportedHandler). Relative imports throughout, not the `@/*`
// alias — this file is bundled directly by wrangler, not through Astro's
// own Vite pipeline, so there's no guarantee tsconfig paths resolve here.
//
// Ported from the Next.js app's /api/cron/sync-wca route — same two calls,
// same options — just triggered by a native Cron Trigger instead of a
// CRON_SECRET-guarded HTTP endpoint (see wrangler.jsonc's [triggers] and
// the plan doc's "Cron" decision).
//
// --- Edge caching + rate limiting ---
// Every page here is SSR (astro.config.mjs's output: 'server') and does at
// least one D1 round trip, with zero caching anywhere — repeatedly hitting
// several routes (e.g. manual perf testing, or a scraper) re-runs all of
// that on every single request. On the Workers Free plan that's what was
// tripping the "exceeded resource limits" error: there's no code-level dial
// to raise the ~10ms CPU/request cap, so the only way to stay under it is
// to do the expensive work (D1 queries + Astro rendering) less often.
// Two layers, applied only to the page routes below (never to /api/* or
// POST requests, which already set their own no-store headers):
//   1. Caching: a cache hit skips D1 + rendering entirely. Anonymous
//      visitors get this on repeat clicks (edge cache only — the browser
//      always revalidates, see below); authenticated ones only get it via <ClientRouter />
//      (Layout.astro) skipping the full-page-reload cost, not via
//      caching — see the Cache-Control comment further down for why.
//   2. Rate limiter: a backstop against sustained bursts across many
//      distinct/uncached URLs (bots, load tests), independent of caching.
//
// Every page goes through Layout.astro (src/layouts/Layout.astro), which
// reads the "userInfo" cookie to compute isLoggedIn/isAdmin — and even the
// viewer's own email for the footer — for literally every route, not just
// /members. Two different caches are in play, with two different rules,
// because they have very different sharing properties:
//
//   1. Cloudflare's edge Cache API (`caches.default`) — SHARED across every
//      visitor who hits the same URL. Anonymous-only: a logged-in render
//      written here would leak that visitor's login state (and email) to
//      the next, unrelated visitor of the same URL. (Tried keying it
//      per-visitor instead of excluding auth entirely — see the note
//      below; reverted, it didn't work.)
//   2. The requesting browser's own HTTP cache. NO page gets a real
//      max-age here, anonymous or authenticated — every response leaves
//      as `private, no-cache` (see forBrowser() below). Anonymous pages
//      used to get `max-age=60`, which meant a page cached before login
//      could be reused after it: the navbar flipping to Login and the
//      Requests link vanishing while logged in, production-only.
//
// Tried (and reverted): keying the EDGE cache per-visitor by folding the
// cookie's value into the cache key, so a logged-in visitor's repeat click
// could hit a dedicated edge cache entry. Cloudflare's Cache API silently
// failed to persist anything written under that scheme — cache.put()
// resolved without error, but an immediate self-verifying cache.match()
// for the identical key right after still came back empty, consistently,
// regardless of TTL, Cache-Control value, or how the key Request was
// constructed. Isolated it to "a real auth cookie was present on the
// request" specifically — not the D1 queries Layout.astro does for a real
// cookie (reproduced with no D1 work at all), not the key string (an
// authenticated key byte-identical to a working anonymous one still
// failed), not timing. Couldn't find the actual cause, so not shipping
// edge-cache writes that have been proven not to reliably work.
//
// Tried (and reverted): giving authenticated responses a real
// `private, max-age=N` browser-cache TTL too, so even logged-in repeat
// clicks would skip the network. Broke correctness instead: the browser's
// HTTP cache is keyed purely by URL, with no concept of "this entry was
// for a different cookie" (no Vary: Cookie here, and Vary on Cookie isn't
// practically usable — it would vary per literal cookie value, defeating
// caching entirely). A page cached while anonymous — normal, happens on
// every first visit before logging in — would then get served as-is
// after logging in, with zero server round trip, for up to that TTL:
// Login/Logout and the admin Requests link would flicker depending on
// which pages still had a stale pre-login entry. The same failure applied
// to anonymous pages' own `max-age=60` until that went too: the
// `Clear-Site-Data: "cache"` that src/pages/api/auth/callback.ts sends on
// login was supposed to wipe pre-login entries, but isn't reliably honored
// across browsers. It's still sent, as a harmless extra, but correctness no
// longer depends on it.
const CACHEABLE_PATTERNS: RegExp[] = [
  /^\/$/,
  /^\/learn\/?$/,
  /^\/competitions\/?$/,
  /^\/competitions\/[^/]+\/?$/,
  /^\/rankings\/?$/,
  /^\/members\/?$/,
  /^\/members\/[^/]+\/?$/,
  /^\/llms\.txt$/,
];

const CACHE_FRESH_SECONDS = 60;
// How long an anonymous page stays in the edge cache at all. Past
// CACHE_FRESH_SECONDS it's "stale": still served instantly, but the request
// also re-renders it in the background (see the fetch handler below).
// Cloudflare's Cache API doesn't implement stale-while-revalidate itself —
// a 60s s-maxage meant the first visitor after every idle minute paid the
// full D1 + render cost (~500ms TTFB vs ~100ms for a hit) — so it's done by
// hand, using EDGE_CACHE_STORED_AT_HEADER to know an entry's age.
const EDGE_CACHE_MAX_STALE_SECONDS = 86400;
const EDGE_CACHE_STORED_AT_HEADER = "X-CK-Cached-At";

function hasAuthCookie(request: Request): boolean {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return false;
  return cookieHeader.split(";").some((pair) => pair.trim().startsWith("userInfo="));
}

// The Cache-Control every cacheable page carries ON ITS WAY TO THE BROWSER,
// anonymous or not, edge-cache hit or fresh render: the browser may keep a
// copy, but must ask the Worker before reusing it. The edge cache's own copy
// keeps its long s-maxage (renderCacheable sets that, and it's what
// cache.put() stores) — only the outgoing response is rewritten here.
//
// Why anonymous pages too: their navbar is rendered logged-out. With a real
// browser max-age (this used to be `public, max-age=60`) any page visited
// before logging in could be served straight from the browser's disk cache
// after login — Login instead of Logout, no admin Requests link — with no
// request ever reaching hasAuthCookie() to notice. The login callback's
// `Clear-Site-Data: "cache"` was meant to wipe those entries, but browser
// support for that directive is patchy (it's what made the bug intermittent
// and production-only — `astro dev` skips this file entirely). With
// `no-cache`, every navigation reaches the Worker, which picks the right
// response from the actual cookie; an anonymous repeat click is still just
// an edge-cache hit (no D1, no render), so it stays cheap. `Vary: Cookie` is
// belt-and-braces for any cache in between that does honor it.
const BROWSER_CACHE_CONTROL = "private, no-cache";

function forBrowser(response: Response): Response {
  if (!response.ok) return response;
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", BROWSER_CACHE_CONTROL);
  headers.set("Vary", "Cookie");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function isCacheablePath(url: URL): boolean {
  return CACHEABLE_PATTERNS.some((pattern) => pattern.test(url.pathname));
}

// Edge cache key for an anonymous page: its URL plus this deploy's version
// id (wrangler.jsonc's version_metadata binding), so entries from a
// previous deploy are simply never matched — they'd reference /_astro/*
// chunks the new deploy no longer has. A plain GET Request, so nothing
// from the visitor's request headers leaks into the key.
function pageCacheKey(url: URL, env: Env): Request {
  const versionId = (env as Env & { CF_VERSION_METADATA?: { id: string } }).CF_VERSION_METADATA?.id ?? "dev";
  const keyUrl = new URL(url);
  keyUrl.searchParams.set("__deploy", versionId);
  return new Request(keyUrl.toString(), { method: "GET" });
}

// --- /media/* (R2 media served from our own domain) ---
// Media used to load straight from the bucket's r2.dev URL, which serves
// HTTP/1.1 only, sends no Cache-Control at all (every visit re-downloaded
// every gallery photo), and is rate-limited by Cloudflare. Streaming the
// object through here instead gets HTTP/2+3, a real browser cache TTL, and
// the edge cache in front of R2. Streaming a body costs next to no CPU.
// Handled before the rate limiter on purpose: one homepage load is ~30
// photo requests, which would eat most of a visitor's per-minute budget.
const MEDIA_PREFIX = "/media/";
// Gallery uploads get a fresh UUID key each time (admin-add-photo.ts) and
// are never overwritten, so they're safe to cache forever. Older assets
// (e.g. images/misc/*, the highlight video) have fixed names that could be
// overwritten in place, so they get 30 days instead of `immutable`. (HEAD
// needs no special-casing below — the runtime drops a HEAD body itself.)
const MEDIA_IMMUTABLE_PREFIX = "images/gallery/";
const MEDIA_CACHE_CONTROL_IMMUTABLE = "public, max-age=31536000, immutable";
const MEDIA_CACHE_CONTROL = "public, max-age=2592000, stale-while-revalidate=86400";
// `?w=<width>` on an image resizes it (and re-encodes to WebP) through the
// Cloudflare Images binding — gallery originals are up to several MB, but
// they're displayed as ~260px marquee tiles. Only these widths are accepted
// so arbitrary values can't mint unlimited transformations (the free plan
// includes 5,000 unique ones a month); anything else gets the original.
// Must match MEDIA_IMAGE_WIDTHS in src/config/media.ts.
const MEDIA_IMAGE_WIDTHS = new Set([320, 640, 800]);

async function serveMedia(request: Request, env: Env, ctx: ExecutionContext, url: URL): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }
  const key = decodeURIComponent(url.pathname.slice(MEDIA_PREFIX.length));
  if (!key || key.includes("..")) return new Response("Not found", { status: 404 });

  // Range requests (video seeking) bypass the edge cache — the Cache API
  // can't store 206 responses — and go straight to R2. A HEAD just gets the
  // full-object headers.
  const isRange = request.method === "GET" && request.headers.has("Range");
  const requestedWidth = Number(url.searchParams.get("w"));
  const width = !isRange && MEDIA_IMAGE_WIDTHS.has(requestedWidth) ? requestedWidth : null;
  const cache = (caches as unknown as { default: Cache }).default;
  // Normalized so unrelated query strings can't bust the cache.
  const cacheKey = new Request(`${url.origin}${url.pathname}${width ? `?w=${width}` : ""}`, { method: "GET" });
  if (!isRange) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  }

  const object = await env.MEDIA.get(key, { range: isRange ? request.headers : undefined, onlyIf: request.headers });
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  headers.set(
    "Cache-Control",
    key.startsWith(MEDIA_IMMUTABLE_PREFIX) ? MEDIA_CACHE_CONTROL_IMMUTABLE : MEDIA_CACHE_CONTROL,
  );
  headers.set("Accept-Ranges", "bytes");

  // onlyIf matched a conditional header (If-None-Match etc.) — no body.
  if (!("body" in object)) return new Response(null, { status: 304, headers });

  // The adapter adds the IMAGES binding to the generated wrangler config
  // (dist/server/wrangler.json) rather than wrangler.jsonc, so it isn't on
  // the generated Env type.
  const images = (env as Env & { IMAGES?: ImagesBinding }).IMAGES;
  if (width && images && headers.get("Content-Type")?.startsWith("image/")) {
    try {
      const transformed = await images
        .input(object.body)
        .transform({ width, fit: "scale-down" })
        .output({ format: "image/webp", quality: 72 });
      const resizedHeaders = new Headers(headers);
      resizedHeaders.set("Content-Type", "image/webp");
      const response = new Response(transformed.response().body, { status: 200, headers: resizedHeaders });
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
      return response;
    } catch (error) {
      // Over the transformation quota, unsupported input, etc. — serve the
      // original rather than a broken image. Its body stream was already
      // handed to the binding, so fetch it again (uncached under this key).
      console.error("[media] resize failed, serving original:", key, error);
      const original = await env.MEDIA.get(key);
      if (!original) return new Response("Not found", { status: 404 });
      return new Response(original.body, { status: 200, headers });
    }
  }

  if (isRange && object.range) {
    // R2Range is a union, but the runtime fills in offset/length even for
    // a suffix range ("bytes=-N"), leaving the other keys present-but-undefined.
    const range = object.range as { offset?: number; length?: number; suffix?: number };
    const offset = range.offset ?? (range.suffix !== undefined ? object.size - range.suffix : 0);
    const length = range.length ?? object.size - offset;
    headers.set("Content-Range", `bytes ${offset}-${offset + length - 1}/${object.size}`);
    headers.set("Content-Length", String(length));
    return new Response(object.body, { status: 206, headers });
  }

  headers.set("Content-Length", String(object.size));
  const response = new Response(object.body, { status: 200, headers });
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith(MEDIA_PREFIX)) return serveMedia(request, env, ctx, url);
    const cacheablePath = request.method === "GET" && isCacheablePath(url);
    const authenticated = cacheablePath && hasAuthCookie(request);
    // Only the anonymous case uses the shared edge cache — see the big
    // comment above for why authenticated responses skip it entirely.
    const useEdgeCache = cacheablePath && !authenticated;
    // `caches.default` is a Cloudflare-specific extension of the standard
    // CacheStorage interface (the global CDN cache, distinct from
    // `caches.open(name)`'s namespaced caches) — not present on the DOM
    // lib's CacheStorage type that this program also pulls in for the
    // client-side React islands, hence the cast.
    const cache = (caches as unknown as { default: Cache }).default;

    const cacheKey = useEdgeCache ? pageCacheKey(url, env) : null;
    if (cacheKey) {
      const cached = await cache.match(cacheKey);
      if (cached) {
        // Stale (past CACHE_FRESH_SECONDS): still answer instantly, and
        // refresh the entry in the background for the next visitor.
        const storedAt = Number(cached.headers.get(EDGE_CACHE_STORED_AT_HEADER)) || 0;
        if (Date.now() - storedAt > CACHE_FRESH_SECONDS * 1000) {
          ctx.waitUntil(
            renderCacheable(new Request(request.url, { method: "GET" }), env, ctx, false).then((fresh) =>
              fresh.ok ? cache.put(cacheKey, fresh) : undefined,
            ),
          );
        }
        return forBrowser(cached);
      }
    }

    // Only requests that actually reach this point count against the rate
    // limit. An anonymous visitor served from the edge cache returned above
    // and never reaches here; every authenticated request does, since
    // those are never edge-cached (see above).
    const clientIp = request.headers.get("CF-Connecting-IP") ?? "unknown";
    const { success } = await env.RATE_LIMITER.limit({ key: clientIp });
    if (!success) {
      return new Response("Too many requests — please slow down and try again shortly.", {
        status: 429,
        headers: { "Retry-After": "30" },
      });
    }

    if (!cacheablePath) return handle(request, env, ctx);
    const response = await renderCacheable(request, env, ctx, authenticated);
    if (cacheKey && response.ok) ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return forBrowser(response);
  },
  async scheduled(_event, env, _ctx) {
    const db = getDb(env.DB);
    const wcaIds = await getAllMemberWcaIds(db);

    console.log(`[Cron] Triggered WCA Sync for ${wcaIds.length} members`);
    await syncMemberWcaData(db, wcaIds, { timeBudgetMs: 50_000, rotateOffset: true });

    console.log("[Cron] Triggered Competitions Sync");
    await syncCompetitions(db);
  },
} satisfies ExportedHandler<Env>;

// Renders a cacheable page route through Astro and sets its caching
// headers. Shared by the normal request path and the background
// stale-while-revalidate refresh above.
async function renderCacheable(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  authenticated: boolean,
): Promise<Response> {
  const response = await handle(request, env, ctx);
  if (!response.ok) return response;

  const headers = new Headers(response.headers);
    // None of the cacheable routes set cookies today, but if one ever does
    // (e.g. a new analytics cookie), it must never ride along into a
    // response reused across multiple requests via the edge cache, or
    // persisted in the browser's own cache past this response.
    headers.delete("Set-Cookie");
    // Authenticated responses deliberately get NO real max-age — tried
    // that (`private, max-age=60`) and it caused a real, confusing bug:
    // the browser's HTTP cache is keyed purely by URL, with no concept of
    // "this entry was for a different cookie" (no Vary: Cookie here). A
    // page cached while anonymous — perfectly normal, happens on every
    // first visit before logging in — would then get served as-is to the
    // same visitor after logging in, with zero server round trip, for up
    // to that TTL: the navbar would flip between Login/Logout and the
    // admin Requests link would appear/disappear depending on which pages
    // still had a stale pre-login entry. `no-cache` forces every
    // authenticated request to revalidate with the server first — no
    // entry is ever reused blindly — so this can't happen, at the cost of
    // authenticated repeat-clicks no longer skipping the network (they
    // still skip the extra cost of a full page reload, via ClientRouter).
    // s-maxage is what the edge Cache API keys its own expiry off — the
    // long stale window. This value is only what cache.put() stores; the
    // browser never sees it (fetch() rewrites it via forBrowser()).
    headers.set(
      "Cache-Control",
      authenticated
        ? "no-cache"
        : `public, max-age=${CACHE_FRESH_SECONDS}, s-maxage=${EDGE_CACHE_MAX_STALE_SECONDS}`,
    );
    if (!authenticated) headers.set(EDGE_CACHE_STORED_AT_HEADER, String(Date.now()));
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
}
