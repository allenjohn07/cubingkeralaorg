import { useSyncExternalStore } from "react";
import type { FilterState } from "@/types/ranking";

// The /rankings page's selected event/round, shared between its two islands
// (RankingsHeader — title + filter menus — and RankingsResults — the table).
// They're separate islands so each can sit in its own `data-reveal` wrapper
// in the .astro page, like /members and /competitions; Astro islands on one
// page share module instances, so this module-level store is the one source
// of truth for both. Server render uses the default for both, so they agree.

export const DEFAULT_RANKINGS_FILTER: FilterState = { event: "333", round: "single" };

let current: FilterState = DEFAULT_RANKINGS_FILTER;
const listeners = new Set<() => void>();

export function setRankingsFilter(next: FilterState) {
  current = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useRankingsFilter(): FilterState {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => DEFAULT_RANKINGS_FILTER,
  );
}
