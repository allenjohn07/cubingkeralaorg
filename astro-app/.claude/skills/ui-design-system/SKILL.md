---
name: ui-design-system
description: Cubing Kerala (Astro rewrite) UI/design-system reference — layout primitives, the shared table system, dark mode wiring, button/link conventions, and established component patterns. Load before building or changing any visual section, page, or component in astro-app/, so new work stays consistent with what already exists.
---

# Cubing Kerala — UI design system (astro-app)

Reference this before adding or changing anything visual. The rule of thumb: **reuse
an established primitive instead of inventing a new one-off pattern.** If something
here doesn't cover the case, look for the closest existing pattern and match it rather
than freelancing a new style.

## Stack

Astro 7 (`@astrojs/cloudflare`, Workers mode) + `@astrojs/react` islands + Tailwind CSS
v4 (CSS-first config). Plain `.astro` for static markup; React (`.tsx` + `client:load`)
only for components with real interactivity (state, effects, event handlers). Verify a
component actually needs hydration before adding `client:load` — check the built HTML
for `astro-island`/`component-export` if unsure.

## Layout primitives

- **Desktop scale-up / use rem, not px:** `html`'s font-size in `global.css` grows
  fluidly from 100% (≤1024px windows) to 115% (≥1440px), and everything sized in
  rem follows. Write layout sizes (widths, column widths, heights, arbitrary text
  sizes) in rem — e.g. `w-[9.375rem]`, not `w-[150px]` — or they won't scale with
  the rest of the page. Breakpoints (`min-[1400px]:` etc.) stay in px.
- **`NAVBAR_CONTAINER_CLASS`** (`src/components/layout/navbar/layout.ts`) is the one
  true max-width container (steps up to 87.5rem — 1400px at base size). It's the width ceiling for the
  navbar, footer, and every full-width page section — content never exceeds it. A
  narrower column (e.g. `max-w-160` / `max-w-3xl`) is used *inside* it for hero text or
  other deliberately narrow reading columns, never as a replacement for it.
- **`cn()`** (`@/lib/utils`, clsx + tailwind-merge) for every conditional/merged
  className. Don't hand-concatenate template strings for conditional classes.
- Page sections wrap in `<div class={NAVBAR_CONTAINER_CLASS}>` with `py-6 sm:py-10` (or
  similar) for list/detail pages; the homepage uses `flex flex-col gap-28` between
  stacked sections inside that same container.

## Dark mode

- Class-based, not media-query: toggled by adding/removing `.dark` on `<html>`, driven
  by `useTheme()` + `localStorage` (`ck_theme` key). **Requires**
  `@custom-variant dark (&:where(.dark, .dark *));` in `src/styles/global.css` — without
  it, Tailwind v4 silently falls back to a media-query `dark:`, and every `dark:`
  utility in the app stops responding to the manual toggle. Never remove this.
- `src/layouts/Layout.astro` has an inline anti-FOUC `<script is:inline>` that applies
  `.dark` before first paint by reading the same localStorage key — keep it in sync if
  the storage key or logic ever changes.
- **Image inversion for dark mode**: only safe on a genuinely monochrome asset.
  Before adding `dark:invert` to a logo/icon image, check its actual pixel data (e.g.
  `PIL`/`getcolors()`) to confirm every non-transparent pixel is true grayscale
  (R=G=B). Inverting a multi-color PNG distorts it (confirmed bug this project hit —
  looked fine in light mode, became an unrecognizable mess in dark mode once inverted).
  The footer's Allen John logo (`public/allen-logo-transparent.png`) is a verified-safe
  example of this pattern.
- Theme switches are instant everywhere: `useTheme` adds `theme-switching` to
  `<html>` for the frame the `dark` class flips, which suspends all transitions
  (`global.css`). `transition-colors` on controls is fine — don't add per-component
  workarounds for theme-toggle fades. Toggle the theme only via `useTheme`.
- The viewport meta tag (`width=device-width, initial-scale=1`) in `Layout.astro` is
  load-bearing — its absence caused a real mobile rendering bug (whole page shrinking
  into a framed box). Don't touch it without a specific reason.

## The shared table system ("DATA_GRID")

`src/components/ui/data-grid.ts` exports the bordered, 1px-grid table look used by
every list page (Competitions, Rankings, Members) and their homepage preview sections:

- `DATA_GRID_WRAP` — outer rounded/bordered wrapper (`rounded-md border-l border-t`)
- `DATA_GRID_TABLE`, `DATA_GRID_ROW`, `DATA_GRID_CELL`, `DATA_GRID_HEAD`,
  `DATA_GRID_TOOLBAR` — the individual piece classes

`src/components/ui/table.tsx` provides the underlying `Table`/`TableHeader`/`TableRow`/
`TableHead`/`TableBody`/`TableCell` primitives these classes are applied to.

**Homepage preview sections reuse the real table component from the full page** (e.g.
`RankingsTable`, `MembersTable`) sliced to a handful of rows — never hand-roll a
simplified duplicate table with different columns. Pattern (see
`rankings-preview-section.tsx`, `members-preview-section.tsx`,
`competitions-preview-section.tsx`'s `PastCompetitionsSection`):

```tsx
<div className="relative">
  <RealTableComponent {...slicedProps} />
  <div
    aria-hidden
    className="pointer-events-none absolute inset-x-0 bottom-0 h-16 rounded-b-md bg-gradient-to-b from-transparent to-background"
  />
</div>
<p className="mt-3 text-sm">
  <a href="/full-page" className="text-primary hover:underline">View full X →</a>
</p>
```

## Side-by-side content sections

Established by `HighlightVideoSection`, mirrored by `AchievementBanner`. Use this
whenever a section pairs one media element (image/video) with a block of text content:

```tsx
<section className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-center lg:gap-16">
  <MediaElement className="shrink-0 ..." />
  <div className="flex max-w-md w-full flex-col gap-4 self-start text-left lg:self-auto">
    {/* heading + description, optionally a <dl> of label/value rows */}
  </div>
</section>
```

On mobile this stacks (media first, centered); at `lg:` it goes side-by-side.

## Buttons and links

- `src/components/ui/button.tsx` — cva variants `default`/`destructive`/`outline`/
  `secondary`/`ghost`/`link`, sizes `default`/`sm`/`lg`/`icon`.
- Inline link-styled CTAs (e.g. a WCA ID with an external-link arrow) use
  `<Button variant="link" className="h-auto w-fit px-0" asChild><a>...</a></Button>`
  with an `ArrowUpRight` (lucide) icon — see `MemberDetail`'s WCA ID link and
  `AchievementBanner`'s ID link, which were deliberately made to match each other.
- Every external link: `target="_blank" rel="noopener noreferrer"`.
- Every icon-only button: `aria-label` (accessibility) **and** `cursor-pointer`
  (confirmed past bug — several navbar icon buttons were missing `cursor-pointer` and
  looked non-interactive on desktop even though they worked).

## Images and media

- Plain `<img>` everywhere — no `next/image`, no `astro:assets` `<Image>` (deliberate
  simplification; don't introduce either). Every `<img>` needs real, descriptive `alt`
  text.
- Real uploaded photos/video live under `public/images/*` and `public/videos/*`. There
  is no placeholder/stand-in component anymore — it was deleted once real assets
  replaced every spot that used it. Reference real assets directly.
- Video sections autoplay when scrolled into view and pause when scrolled out
  (`IntersectionObserver`, see `HighlightVideoSection`), `muted` + `playsInline` +
  native `controls` (autoplay must be muted or browsers block it).

## Motion

- Anything scroll-adjacent should be pure CSS (transforms/keyframes), not JS scroll
  listeners — the hero photo marquee is a pure-CSS infinite-scroll (duplicated content,
  `translateX` keyframe, `animation-direction: reverse` for the second row,
  `mask-image` edge fade) specifically because earlier JS-driven scroll interceptors
  caused real scroll-capture/jank bugs. Respect `prefers-reduced-motion`.
- Framer Motion is installed but not currently used anywhere in the UI — don't add it
  speculatively; CSS has covered every case so far.
- **Section entrance animations:** add `data-reveal` to a section's wrapper and
  it eases in (fade + 16px slide + 0.98→1 scale) every time it scrolls into
  view, from the side it enters on — rising while scrolling down, settling down
  from above while scrolling up. It's re-armed only once fully off-screen, so
  the reset is never visible. Blocks entering together stagger by 80ms
  (`data-reveal-delay="ms"` adds a base delay). Script is inline in `Layout.astro`'s `<head>`, CSS under
  "Section reveal" in `global.css`. Put `data-reveal` only on Astro-rendered
  markup (wrap a hydrated island in a `<div data-reveal>`), never inside a
  React island. Above-the-fold hero content uses pure-CSS
  `motion-safe:animate-fade-up` / `animate-rise-in` instead, so the largest paint
  never waits on JavaScript.
- The site-wide cursor-reveal background is `DotField`
  (`src/components/layout/dot-field.astro`, rendered once in `Layout.astro`).
  Any pointer-reactive effect should follow its pattern: plain Canvas 2D in a bundled
  `<script>` (no React island), invisible at rest, tiny `--muted-foreground` dots
  with a faint `--primary` tint nearest the cursor, a rAF loop that only runs while something is animating and stops when
  idle, init/teardown on `astro:page-load`/`astro:before-swap`, and fully off
  under reduced motion.

## Mock data

Every page/component reads from `src/lib/mock-data.ts` — never inline fixture data in
a component. This keeps the eventual swap to real D1 queries (Phase 2 of the
migration) a one-line change per page.

## Verification after any visual change

```bash
npx tsc --noEmit
npm run build
# grep dist/client/**/*.html for the markup you expect, e.g. row counts, class names
rm -rf dist
```
