import { useEffect, useRef } from "react";
import { NAVBAR_CONTAINER_CLASS } from "@/components/layout/navbar/layout";
import { mediaUrl } from "@/config/media";

const EVENT_DETAILS = [
  { label: "Organizers", value: "Akshay Siva, Cubing Kerala, and Smijo P. Abraham" },
  { label: "WCA Delegate", value: "Muhammed Shehzad Khan" },
  { label: "Competitor limit", value: "66 competitors participated out of a 100-person limit" },
];

/**
 * Plays while the frame is on screen, pauses once it scrolls out — browsers
 * only allow unprompted autoplay when muted, so this starts muted; users can
 * unmute via the native controls, we just don't fight their choice afterwards.
 */
export function HighlightVideoSection() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {
            // Autoplay can still be blocked (e.g. low-power mode) — fine,
            // the native controls let the viewer start it manually.
          });
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <section className={NAVBAR_CONTAINER_CLASS}>
      <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-center lg:gap-16">
        {/* The source clip is portrait (720x1280), not landscape — forcing
            `aspect-video` (16:9) letterboxed it and left the controls bar and
            hover interaction spanning the full empty-letterbox width instead
            of just the visible frame. Sizing by height + `aspect-[9/16]`
            instead makes the element's own box match the video exactly. */}
        <video
          ref={videoRef}
          src={mediaUrl("videos/hilite_comp.mp4")}
          muted
          loop
          playsInline
          controls
          preload="metadata"
          className="aspect-[9/16] h-[26.25rem] shrink-0 rounded-2xl sm:h-[32.5rem] lg:h-[37.5rem]"
        />

        <div className="flex max-w-md w-full flex-col gap-4 self-start text-left lg:self-auto">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">HiLITE Cube Open 2026</h2>
            <p className="text-muted-foreground">
              A speedcubing competition held September 12–13, 2026 at the HiLITE Mall Atrium in Thrissur, Kerala.
            </p>
          </div>

          <dl className="flex flex-col gap-1.5 text-sm">
            {EVENT_DETAILS.map((detail) => (
              <div key={detail.label}>
                <dt className="inline font-medium text-foreground">{detail.label}: </dt>
                <dd className="inline text-muted-foreground">{detail.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
