import { NAVBAR_CONTAINER_CLASS } from "@/components/layout/navbar/layout";

interface Photo {
  src: string;
  /** Optional resized variants (see mediaImageSrcSet) — tiles are 220–260px wide, up to ~300px on desktop (global.css root scale-up). */
  srcSet?: string;
  alt: string;
}

// Tiles per row that can be visible on first paint (a 1400px row fits ~6).
const EAGER_COUNT = 6;
// Of those, how many get fetchpriority="high" — a couple, not all twelve,
// so they don't all compete with each other for the first bytes.
const HIGH_PRIORITY_COUNT = 2;

// Content is duplicated (photos, photos) so a translateX(-50%) loop (see
// .marquee-track in global.css) lands exactly where the second copy starts
// — a seamless loop with no jump, no scroll container, nothing for a
// pointer or touch gesture to ever capture.
function MarqueeRow({ photos, reverse, durationSeconds }: { photos: Photo[]; reverse?: boolean; durationSeconds: number }) {
  const track = [...photos, ...photos];

  return (
    <div
      className={reverse ? "marquee-track marquee-track-reverse flex w-max gap-3" : "marquee-track flex w-max gap-3"}
      style={{ animationDuration: `${durationSeconds}s` }}
    >
      {track.map((photo, index) => {
        // Position within one copy of the photos. The reverse row's
        // animation starts at translateX(-50%) — i.e. showing the *second*
        // copy — so eagerness must follow the photo, not the raw index, or
        // its on-screen tiles at load would be the lazy ones (they were:
        // Lighthouse's LCP image was a lazy second-copy tile).
        const position = index % photos.length;
        return (
          <div
            key={`${photo.src}-${index}`}
            className="h-40 w-55 relative shrink-0 overflow-hidden rounded-2xl sm:h-47.5 sm:w-65"
          >
            {/* Static placeholder behind the photo (no pulse: an infinite
                animation here showed through as a flicker on mobile): the <img> is transparent
                until its bytes arrive, so slow photos show a soft tile instead
                of a hole. */}
            <span aria-hidden className="absolute inset-0 bg-muted" />
            <img
              src={photo.src}
              srcSet={photo.srcSet || undefined}
              sizes="(min-width: 1024px) 300px, (min-width: 640px) 260px, 220px"
              alt={photo.alt}
              // The first few tiles of each row are on screen at load — fetch
              // them right away; the rest can wait until they near the
              // viewport. Both copies of a photo share one URL, so the
              // duplicate is a cache hit either way.
              loading={position < EAGER_COUNT ? "eager" : "lazy"}
              fetchPriority={position < HIGH_PRIORITY_COUNT ? "high" : "auto"}
              decoding="async"
              className="relative h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:hover:scale-105"
            />
          </div>
        );
      })}
    </div>
  );
}

// Zero JS — pure CSS animation, so there's never a scroll/hover interaction
// with this at all. Replaces the hero's old static photo row entirely.
// Capped at the site's usual max width (same container the navbar and
// footer use) rather than running edge-to-edge — that container is the
// site's actual width ceiling.
//
// Photos now come from the Photos table (admin-managed via /requests, see
// photo-gallery-admin.tsx) instead of a hardcoded list — row1/row2 are
// split server-side in index.astro by alternating insertion order, so
// newly added photos land in whichever row keeps the two balanced.
export function HeroPhotoMarquee({ row1, row2 }: { row1: Photo[]; row2: Photo[] }) {
  if (row1.length === 0 && row2.length === 0) return null;

  return (
    // Eases in with pure CSS (not data-reveal) — it's above the fold and
    // usually the page's largest paint, so it mustn't wait on any script.
    // Delayed so it arrives just after the hero title's own fade-up.
    <section
      style={{ animationDelay: "350ms" }}
      className={`${NAVBAR_CONTAINER_CLASS} marquee-fade overflow-hidden motion-safe:animate-rise-in`}
    >
      <div className="flex flex-col gap-3">
        {row1.length > 0 && <MarqueeRow photos={row1} durationSeconds={38} />}
        {row2.length > 0 && <MarqueeRow photos={row2} durationSeconds={32} reverse />}
      </div>
    </section>
  );
}
