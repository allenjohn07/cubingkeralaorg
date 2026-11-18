import { useState, useEffect, useCallback } from "react";
import { Moon, Sun } from "lucide-react";
import { useDesktopNav } from "@/hooks/useDesktopNav";
import { useTheme } from "@/hooks/useTheme";
import { NavLinks } from "./navbar/nav-links";
import { LogoLink } from "./logo-link";
import { MobileMenu } from "./navbar/mobile-menu";
import { NAVBAR_CONTAINER_CLASS, NAVBAR_LINKS_GAP_CLASS } from "./navbar/layout";
import { cn } from "@/lib/utils";

// currentPath, isAdmin, AND isLoggedIn all come from Layout.astro — computed
// server-side there by reading the (now httpOnly) userInfo cookie, the same
// way middleware.ts does, rather than client-side. This used to read
// isLoggedIn from a client-side cookie check instead (useAuth, since
// removed), which only worked because userInfo wasn't httpOnly; now that it
// is, JS can no longer see it at all, and server-computed props are strictly
// better here anyway — correct on first paint, no flash, no "has the client
// check run yet" bookkeeping.
export const Navbar = ({
  currentPath = "",
  isAdmin = false,
  isLoggedIn = false,
}: {
  currentPath?: string;
  isAdmin?: boolean;
  isLoggedIn?: boolean;
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Mounted on first open and kept mounted after, so closing still animates.
  const [hasOpenedMenu, setHasOpenedMenu] = useState(false);
  const isDesktopNav = useDesktopNav();
  const { theme, toggleTheme } = useTheme();

  const login = useCallback(() => {
    window.location.href = "/login";
  }, []);

  // Both login and logout end in a full page navigation (the OAuth
  // redirect, and a fresh load of "/" here) — a real SSR re-render, computed
  // from the actual cookie state, always follows. No client-side session
  // state needs tracking in between.
  //
  // The `__fresh` param forces this to be a URL the browser has definitely
  // never cached before. Redundant belt-and-braces: no page is ever reused
  // from the browser cache without revalidating (worker.ts's forBrowser()).
  // Layout.astro strips the param from the address bar right after load.
  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = `/?__fresh=${Date.now()}`;
    }
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    if (isDesktopNav && isMenuOpen) {
      setIsMenuOpen(false);
    }
  }, [isDesktopNav, isMenuOpen]);

  return (
    <div className="relative sticky top-0 z-[10000] bg-background text-foreground">
      {/* Logo/login edges follow the same wide container as the footer (and
          every other page) — the hero's narrower 640px column only governs
          where the nav *links* sit, not the bar's own outer edges. */}
      <div className={NAVBAR_CONTAINER_CLASS}>
        <div className="flex h-16 w-full items-center">
          <LogoLink onClick={closeMenu} />

          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="hidden size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-primary lg:inline-flex"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            <button
              type="button"
              onClick={isLoggedIn ? logout : login}
              className={cn(
                "hidden cursor-pointer text-sm font-medium underline underline-offset-4 transition-opacity hover:opacity-70 lg:inline-block",
                isLoggedIn ? "text-destructive" : "text-primary",
              )}
            >
              {isLoggedIn ? "Logout" : "Login"}
            </button>

            <button
              type="button"
              onClick={() => {
                setHasOpenedMenu(true);
                setIsMenuOpen((open) => !open);
              }}
              className="relative flex h-10 w-10 cursor-pointer items-center justify-center text-foreground lg:hidden"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu-panel"
            >
              <span className="sr-only">{isMenuOpen ? "Close navigation menu" : "Open navigation menu"}</span>
              <div className="relative h-[14px] w-[18px]">
                <span
                  className={cn(
                    "absolute left-0 top-0 h-[2px] w-full rounded-full bg-current",
                    isMenuOpen && "top-[6px] rotate-45",
                  )}
                />
                <span
                  className={cn(
                    "absolute left-0 top-[6px] h-[2px] w-full rounded-full bg-current",
                    isMenuOpen && "opacity-0",
                  )}
                />
                <span
                  className={cn(
                    "absolute left-0 top-[12px] h-[2px] w-full rounded-full bg-current",
                    isMenuOpen && "top-[6px] -rotate-45",
                  )}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Centered across the full bar width (not tied to the hero's own
          column) so it balances against the now wide-centered hero title
          below it. Positioned absolutely so it overlays the row above
          without affecting the logo/login flex layout — but that means its
          own bounding box now spans edge to edge too, which would silently
          block clicks on the logo/login/hamburger underneath it.
          pointer-events-none here + pointer-events-auto back on each link
          (NAVBAR_LINK_CLASS) keeps only the visible link text clickable. */}
      <nav
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 hidden h-16 items-center justify-center lg:flex",
          NAVBAR_LINKS_GAP_CLASS,
        )}
      >
        <NavLinks isAdmin={isAdmin} currentPath={currentPath} />
      </nav>

      {/* Soft fade under the sticky header, spanning the full bar (not just
          the row above) so it reaches edge to edge like the reference. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-full h-8 bg-gradient-to-b from-background to-transparent"
      />

      {hasOpenedMenu && (
        <MobileMenu
          isOpen={isMenuOpen}
          isAdmin={isAdmin}
          isLoggedIn={isLoggedIn}
          onLogin={login}
          onLogout={logout}
          onClose={closeMenu}
          currentPath={currentPath}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}
    </div>
  );
};
