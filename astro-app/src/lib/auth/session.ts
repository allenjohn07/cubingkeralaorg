import type { AstroCookies } from "astro";
import { env } from "cloudflare:workers";

// The login session, stored client-side in the `userInfo` cookie and signed
// so it can't be forged. Before this, the cookie was the raw WCA /me JSON,
// trusted as-is: anyone could hand-write `{"me":{"wca_id":"<admin's ID>"}}`
// (WCA IDs are public) and be treated as that user — admin included.
//
// Format: `<payload>.<signature>`
//   payload   = base64url(JSON.stringify(SessionPayload))
//   signature = hex(HMAC-SHA256(payload, SESSION_SECRET))
// Nothing is stored server-side; verifying just means recomputing the HMAC.
// Any cookie that isn't in this exact format — including every pre-signing
// cookie still sitting in browsers — fails verification and is treated as
// logged out (those visitors simply log in once more).
//
// Fails closed: if SESSION_SECRET isn't configured, nobody is logged in and
// creating a session throws, rather than silently skipping the check.

export const SESSION_COOKIE = "userInfo";
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

/** The subset of WCA's /api/v0/me response the app actually uses. */
export interface SessionUser {
  me: {
    id?: number;
    wca_id: string;
    name: string;
    avatar: { url: string };
    country: { name: string };
    gender: string;
  };
}

interface SessionPayload extends SessionUser {
  /** Unix seconds. Checked on read, so a copied cookie stops working on time
   *  even if a browser ignores the cookie's own Max-Age. */
  exp: number;
}

const encoder = new TextEncoder();

function getSecret(): string | null {
  const secret = env.SESSION_SECRET;
  if (!secret) {
    console.error("[auth] SESSION_SECRET is not set — all sessions are treated as logged out");
    return null;
  }
  return secret;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[0-9a-f]{64}$/.test(hex)) return null;
  return Uint8Array.from(hex.match(/../g)!, (byte) => parseInt(byte, 16));
}

/** Signed cookie value for a freshly logged-in user (WCA /me response). */
export async function createSessionValue(wcaMe: SessionUser["me"]): Promise<string> {
  const secret = getSecret();
  if (!secret) throw new Error("SESSION_SECRET is not set");

  const payload: SessionPayload = {
    me: {
      id: wcaMe.id,
      wca_id: wcaMe.wca_id,
      name: wcaMe.name,
      avatar: { url: wcaMe.avatar.url },
      country: { name: wcaMe.country.name },
      gender: wcaMe.gender,
    },
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const encoded = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(encoded));
  return `${encoded}.${toHex(signature)}`;
}

/** The verified session user, or null for anything missing, forged, malformed or expired. */
export async function readSession(cookies: AstroCookies): Promise<SessionUser | null> {
  const value = cookies.get(SESSION_COOKIE)?.value;
  if (!value) return null;

  const [encoded, signatureHex, ...rest] = value.split(".");
  const signature = signatureHex ? fromHex(signatureHex) : null;
  if (!encoded || !signature || rest.length > 0) return null;

  const secret = getSecret();
  if (!secret) return null;

  try {
    // crypto.subtle.verify compares in constant time.
    const valid = await crypto.subtle.verify("HMAC", await hmacKey(secret), signature, encoder.encode(encoded));
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encoded))) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) return null;
    if (!payload.me || typeof payload.me !== "object") return null;
    return { me: payload.me };
  } catch {
    return null;
  }
}
