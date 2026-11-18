import type { APIRoute } from "astro";
import { createSuccessResponse } from "@/lib/api/response";

// No cache-busting needed here, on this response or the window.location.href
// navigation that follows in navbar.tsx — every page reaches the browser as
// `Cache-Control: private, no-cache` (see worker.ts's forBrowser()), so no
// page is ever reused without the Worker re-checking the cookie, in either
// direction (login or logout).
export const POST: APIRoute = ({ cookies }) => {
  cookies.delete("userInfo", { path: "/" });
  return createSuccessResponse({ message: "Logged out successfully" });
};
