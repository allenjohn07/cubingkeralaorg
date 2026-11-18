import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { EventIcon } from "@/components/shared/event-icon";
import type { PersonalRecords } from "@/types/ranking";
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

interface PersonalRecordsTableProps {
  personalRecords: PersonalRecords;
}

export function PersonalRecordsTable({ personalRecords }: PersonalRecordsTableProps) {
  const events = Object.keys(personalRecords);

  return (
    <div className={DATA_GRID_WRAP}>
      <Table className={DATA_GRID_TABLE}>
        <TableHeader className="[&_tr]:border-0">
          <TableRow className={DATA_GRID_ROW}>
            <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD)}>Event</TableHead>
            <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD, "w-[6.25rem]")}>Best</TableHead>
            <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD, "w-[6.25rem]")}>Average</TableHead>
            <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD, "w-[3.75rem]")}>NR</TableHead>
            <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD, "w-[3.75rem]")}>CR</TableHead>
            <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD, "w-[3.75rem]")}>WR</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.length === 0 ? (
            <TableRow className={DATA_GRID_ROW}>
              <TableCell colSpan={6} className={cn(DATA_GRID_CELL, "py-6 text-sm text-muted-foreground")}>
                No personal records yet.
              </TableCell>
            </TableRow>
          ) : (
            events.map((event) => {
              const ranking = personalRecords[event];
              return (
                <TableRow key={event} className={DATA_GRID_ROW}>
                  <TableCell className={cn(DATA_GRID_CELL, "whitespace-nowrap")}>
                    <span className="inline-flex items-center gap-1.5">
                      <EventIcon eventId={event} />
                      {getEventName(event)}
                    </span>
                  </TableCell>
                  <TableCell className={cn(DATA_GRID_CELL, "whitespace-nowrap tabular-nums")}>
                    {formatEventResult(ranking.single?.best, event) ?? ""}
                  </TableCell>
                  <TableCell className={cn(DATA_GRID_CELL, "whitespace-nowrap tabular-nums")}>
                    {event !== "333mbf" ? formatEventResult(ranking.average?.best, event, "average") ?? "" : ""}
                  </TableCell>
                  <TableCell className={cn(DATA_GRID_CELL, "tabular-nums")}>
                    {ranking.single?.country_rank ?? ""}
                  </TableCell>
                  <TableCell className={cn(DATA_GRID_CELL, "tabular-nums")}>
                    {ranking.single?.continent_rank ?? ""}
                  </TableCell>
                  <TableCell className={cn(DATA_GRID_CELL, "tabular-nums")}>
                    {ranking.single?.world_rank ?? ""}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
