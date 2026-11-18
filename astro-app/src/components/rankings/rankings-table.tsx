import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import type { CompetitorData } from "@/types/ranking";
import { formatResult } from "@/utils/wca-formatters";
import { cn } from "@/lib/utils";
import {
  DATA_GRID_CELL,
  DATA_GRID_HEAD,
  DATA_GRID_ROW,
  DATA_GRID_TABLE,
  DATA_GRID_WRAP,
} from "@/components/ui/data-grid";

interface RankingsTableProps {
  sortedResults: CompetitorData[];
  selectedEvent: string;
  selectedRound: string;
  getResult: (member: CompetitorData) => {
    best: number;
    country_rank: number;
    continent_rank: number;
    world_rank: number;
  } | undefined;
}

export function RankingsTable({
  sortedResults,
  selectedEvent,
  selectedRound,
  getResult,
}: RankingsTableProps) {
  const hasResults = sortedResults.some((member) => Boolean(getResult(member)));

  return (
    <div className={DATA_GRID_WRAP}>
      <Table className={DATA_GRID_TABLE}>
        <TableHeader className="[&_tr]:border-0">
          <TableRow className={DATA_GRID_ROW}>
            <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD, "w-[3.125rem]")}>
              #
            </TableHead>
            <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD)}>
              Name
            </TableHead>
            <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD, "w-[6.25rem]")}>
              Best
            </TableHead>
            <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD, "w-[3.75rem]")}>
              NR
            </TableHead>
            <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD, "w-[3.75rem]")}>
              CR
            </TableHead>
            <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD, "w-[3.75rem]")}>
              WR
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!hasResults && (
            <TableRow className={DATA_GRID_ROW}>
              <TableCell
                colSpan={6}
                className={cn(DATA_GRID_CELL, "py-10 text-center text-sm text-muted-foreground")}
              >
                No results to show for this event yet.
              </TableCell>
            </TableRow>
          )}
          {hasResults && sortedResults.map((member, index) => {
            const result = getResult(member);
            const isUnavailable = Boolean(
              "isUnavailable" in member &&
                (member as { isUnavailable?: boolean }).isUnavailable,
            );

            return (
              <TableRow key={member.person.id} className={DATA_GRID_ROW}>
                <TableCell className={cn(DATA_GRID_CELL, "tabular-nums text-muted-foreground")}>
                  {index + 1}
                </TableCell>
                <TableCell className={cn(DATA_GRID_CELL, "whitespace-nowrap font-medium")}>
                  <a
                    href={`/members/${member.person.id}`}
                    className={cn(
                      "hover:text-primary",
                      isUnavailable && "text-muted-foreground",
                    )}
                  >
                    {member.person.name.split("(")[0]}
                  </a>
                </TableCell>
                <TableCell className={cn(DATA_GRID_CELL, "whitespace-nowrap")}>
                  {isUnavailable ? (
                    <span className="text-sm font-normal italic text-muted-foreground">
                      Data Unavailable
                    </span>
                  ) : (
                    formatResult(result, selectedEvent, selectedRound)
                  )}
                </TableCell>
                <TableCell className={cn(DATA_GRID_CELL, "tabular-nums")}>
                  {result?.country_rank || ""}
                </TableCell>
                <TableCell className={cn(DATA_GRID_CELL, "tabular-nums")}>
                  {result?.continent_rank || ""}
                </TableCell>
                <TableCell className={cn(DATA_GRID_CELL, "tabular-nums")}>
                  {result?.world_rank || ""}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
