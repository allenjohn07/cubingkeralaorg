import { FilterComponent } from "./filter";
import { useCallback, useEffect, useMemo } from "react";
import type { CompetitorData } from "@/types/ranking";
import { sortMembersByResult } from "@/utils/wca-sorting";
import { getEventName } from "@/utils/event-names";
import { RankingsTable } from "./rankings-table";
import type { RankingsComponentProps } from "@/types/ranking";
import { DEFAULT_RANKINGS_FILTER, setRankingsFilter, useRankingsFilter } from "./rankings-filter-store";

export const buildMemberResults = (
  rankingsWcaData: RankingsComponentProps["rankingsWcaData"],
  membersList: RankingsComponentProps["members"],
): CompetitorData[] => {
  return membersList.map((member) => {
    const entry = rankingsWcaData?.[member.wcaid];
    if (entry && !entry.isUnavailable) {
      return {
        person: {
          id: member.wcaid,
          name: member.name,
          wca_id: member.wcaid,
          avatar: {
            url: "",
            pending_url: "",
            thumb_url: "",
            is_default: true,
          },
          gender: member.gender,
          country_iso2: "IN",
          url: `https://www.worldcubeassociation.org/persons/${member.wcaid}`,
          country: {
            id: "India",
            name: "India",
            continentId: "_Asia",
            iso2: "IN",
          },
          delegate_status: null,
          class: "person",
          teams: [],
        },
        competition_count: 0,
        personal_records: entry.personal_records,
        medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
        records: { national: 0, continental: 0, world: 0, total: 0 },
      };
    }

    return {
      person: {
        id: member.wcaid,
        name: member.name,
        wca_id: member.wcaid,
        avatar: {
          url: "",
          pending_url: "",
          thumb_url: "",
          is_default: true,
        },
        gender: member.gender,
        country_iso2: "IN",
        url: `https://www.worldcubeassociation.org/persons/${member.wcaid}`,
        country: {
          id: "India",
          name: "India",
          continentId: "_Asia",
          iso2: "IN",
        },
        delegate_status: null,
        class: "person",
        teams: [],
      },
      competition_count: 0,
      personal_records: {},
      medals: { gold: 0, silver: 0, bronze: 0, total: 0 },
      records: { national: 0, continental: 0, world: 0, total: 0 },
      isUnavailable: true,
    } as CompetitorData & { isUnavailable: true };
  });
};

// The /rankings page is two islands, not one, so the .astro page can give
// the header and the table their own `data-reveal` wrappers (like /members
// and /competitions) — one wrapper around both was taller than the screen,
// so it never left the viewport and never replayed its entrance. The
// selected filter is shared through rankings-filter-store.ts.

/** Title, "Showing results for…" line and the event/round menus. */
export function RankingsHeader() {
  const filter = useRankingsFilter();

  // Module state outlives a soft navigation away from /rankings; reset it on
  // the way out so the next visit starts on the default, matching the
  // filter menus (which start fresh) and the server render.
  useEffect(() => () => setRankingsFilter(DEFAULT_RANKINGS_FILTER), []);

  return (
    <div className="mb-4 flex flex-col items-start gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Rankings
        </h1>
        <p className="text-sm text-muted-foreground md:text-base lg:whitespace-nowrap">
          Showing results for {getEventName(filter.event)} {filter.round}
        </p>
      </div>
      <FilterComponent onFilterChange={setRankingsFilter} />
    </div>
  );
}

/** The rankings table for the currently selected event/round. */
export function RankingsResults({
  members,
  rankingsWcaData = {},
}: RankingsComponentProps) {
  const selectedFilter = useRankingsFilter();

  const memberResults = useMemo<CompetitorData[]>(() => {
    if (!members?.length) return [];
    return buildMemberResults(rankingsWcaData, members);
  }, [members, rankingsWcaData]);

  const sortedResults = useMemo(() => {
    if (!memberResults.length) return [];
    return sortMembersByResult(
      memberResults,
      selectedFilter.event,
      selectedFilter.round,
    );
  }, [memberResults, selectedFilter]);

  const getResult = useCallback(
    (member: CompetitorData) => {
      const roundType =
        selectedFilter.round === "average" ? "average" : "single";
      return member.personal_records[selectedFilter.event]?.[roundType];
    },
    [selectedFilter],
  );

  return (
    <RankingsTable
      sortedResults={sortedResults}
      selectedEvent={selectedFilter.event}
      selectedRound={selectedFilter.round}
      getResult={getResult}
    />
  );
}
