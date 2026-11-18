import { useCallback, useMemo, useState } from "react";
import type { RequestInfo } from "@/types/member";
import type { CompetitorData, FilterState, RankingsWcaEntry } from "@/types/ranking";
import { sortMembersByResult } from "@/utils/wca-sorting";
import { buildMemberResults } from "@/components/rankings/rankings-page";
import { FilterComponent } from "@/components/rankings/filter";
import { RankingsTable } from "@/components/rankings/rankings-table";

const PREVIEW_ROW_COUNT = 5;

export function RankingsPreviewSection({
  members,
  rankingsWcaData,
}: {
  members: RequestInfo[];
  rankingsWcaData: Record<string, RankingsWcaEntry>;
}) {
  const [filter, setFilter] = useState<FilterState>({ event: "333", round: "single" });

  const memberResults = useMemo<CompetitorData[]>(
    () => buildMemberResults(rankingsWcaData, members),
    [members, rankingsWcaData],
  );

  const sortedResults = useMemo(
    () =>
      sortMembersByResult(memberResults, filter.event, filter.round).slice(
        0,
        PREVIEW_ROW_COUNT,
      ),
    [memberResults, filter],
  );

  const getResult = useCallback(
    (member: CompetitorData) => {
      const roundType = filter.round === "average" ? "average" : "single";
      return member.personal_records[filter.event]?.[roundType];
    },
    [filter],
  );

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium">Rankings</h2>
        <FilterComponent
          onFilterChange={setFilter}
          triggerClassName="h-7 text-xs"
          eventWidthClassName="w-[5.625rem] sm:w-[6.875rem]"
        />
      </div>

      <div className="relative">
        <RankingsTable
          sortedResults={sortedResults}
          selectedEvent={filter.event}
          selectedRound={filter.round}
          getResult={getResult}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 rounded-b-md bg-gradient-to-b from-transparent to-background"
        />
      </div>

      <p className="mt-3 text-sm">
        <a href="/rankings" className="text-primary hover:underline">
          View full rankings →
        </a>
      </p>
    </section>
  );
}
