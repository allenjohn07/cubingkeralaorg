import { NAVBAR_LOGO_LINK_CLASS } from "./navbar/layout";
import { cn } from "@/lib/utils";

export function LogoLink({
  onClick,
  className,
  titleClassName,
}: {
  onClick?: () => void;
  className?: string;
  /** Defaults to always visible; pass e.g. "hidden sm:inline" to collapse to icon-only on narrow screens. */
  titleClassName?: string;
}) {
  return (
    // aria-label keeps the link named when titleClassName hides the text
    // (e.g. the footer's icon-only mobile layout) — the logo itself is
    // decorative (alt=""), so without it the link has no accessible name.
    <a
      href="/"
      onClick={onClick}
      aria-label="Cubing Kerala home"
      className={cn(NAVBAR_LOGO_LINK_CLASS, "flex items-center gap-2", className)}
    >
      <img src="/cubingkerala_logo.svg" alt="" width={22} height={22} className="size-[1.375rem] shrink-0" />
      <span className={titleClassName}>Cubing Kerala</span>
    </a>
  );
}
