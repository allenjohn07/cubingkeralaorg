/**
 * Shared shell classes — keep navbar and mobile menu headers aligned below `lg`.
 *
 * Mirrors the old Tailwind v3 `container` utility this app used to configure
 * (`center: true`, default breakpoint steps, `2xl` redefined to 1400px
 * instead of Tailwind's default 1536px). Tailwind v4 dropped the
 * config-level `container` option, so the per-breakpoint max-width steps are
 * written out explicitly here — a flat `max-w-[1400px]` would let content
 * get wider than the original on laptop-sized screens (anything narrower
 * than 1400px used to still cap at the next breakpoint down).
 */
export const NAVBAR_CONTAINER_CLASS =
  "mx-auto w-full px-4 sm:px-6 lg:px-8 sm:max-w-[40rem] md:max-w-[48rem] lg:max-w-[64rem] xl:max-w-[80rem] min-[1400px]:max-w-[87.5rem]";

/** Spacing between individual navbar links — 20px, matching the reference. */
export const NAVBAR_LINKS_GAP_CLASS = "gap-5";

export const NAVBAR_LOGO_LINK_CLASS = "text-sm font-semibold tracking-tight text-foreground";

/** Plain text links — muted, green on hover, no padding or background pill.
 * `pointer-events-auto` matters specifically for the desktop nav, which
 * sits inside a `pointer-events-none` full-width overlay (see navbar.tsx)
 * so that overlay's own invisible bounding box can't block clicks on the
 * logo/login/hamburger around it — only the actual link text re-enables
 * clicks. */
export const NAVBAR_LINK_CLASS =
  "pointer-events-auto text-sm text-muted-foreground transition-colors hover:text-primary";
