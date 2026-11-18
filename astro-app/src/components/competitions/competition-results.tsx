import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { EventIcon } from "@/components/shared/event-icon";
import type { CompetitionResultEntry } from "@/types/competition";
import { formatEventResult } from "@/utils/wca-formatters";
import { getEventName } from "@/utils/event-names";
import { cn } from "@/lib/utils";
import {
  DATA_GRID_CELL,
  DATA_GRID_HEAD,
  DATA_GRID_ROW,
  DATA_GRID_TABLE,
  DATA_GRID_WRAP,
} from "@/components/ui/data-grid";

interface CompetitionResultsProps {
  results: CompetitionResultEntry[];
}

function formatTime(value: number, eventId: string, type: "single" | "average" = "single"): string {
  if (value <= 0) return "DNF";
  return formatEventResult(value, eventId, type) || "";
}

export function CompetitionResults({ results }: CompetitionResultsProps) {
  // Podium only — the full per-competitor results list is what WCA's own
  // site is for; this is a quick "who won" summary, not a results browser.
  const podiumResults = results.filter((result) => result.pos <= 3);
  if (podiumResults.length === 0) return null;

  const eventIds = [...new Set(podiumResults.map((result) => result.eventId))];

  return (
    <div className="flex w-full flex-col gap-6">
      <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Results</h2>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {eventIds.map((eventId) => (
          <div key={eventId} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <EventIcon eventId={eventId} />
              <h3 className="text-lg font-semibold tracking-tight">{getEventName(eventId)}</h3>
            </div>
            <div className={DATA_GRID_WRAP}>
              <Table className={DATA_GRID_TABLE}>
                <TableHeader className="[&_tr]:border-0">
                  <TableRow className={DATA_GRID_ROW}>
                    <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD, "w-[3.125rem]")}>#</TableHead>
                    <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD)}>Name</TableHead>
                    <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD)}>Best</TableHead>
                    <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD)}>Average</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {podiumResults
                    .filter((result) => result.eventId === eventId)
                    .sort((a, b) => a.pos - b.pos)
                    .map((result) => (
                      <TableRow key={result.id} className={DATA_GRID_ROW}>
                        <TableCell className={cn(DATA_GRID_CELL, "tabular-nums text-muted-foreground")}>
                          {result.pos}
                        </TableCell>
                        <TableCell className={cn(DATA_GRID_CELL, "whitespace-nowrap font-medium")}>
                          {result.name}
                        </TableCell>
                        <TableCell className={cn(DATA_GRID_CELL, "whitespace-nowrap tabular-nums")}>
                          {formatTime(result.best, eventId, "single")}
                        </TableCell>
                        <TableCell className={cn(DATA_GRID_CELL, "whitespace-nowrap tabular-nums")}>
                          {formatTime(result.average, eventId, "average")}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
