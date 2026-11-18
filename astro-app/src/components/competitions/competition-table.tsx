import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { CompetitionStatusBadge } from "./status-badge";
import { EventIcon } from "@/components/shared/event-icon";
import { formatCompetitionDateRange } from "@/utils/date-utils";
import type { Competition } from "@/types/competition";
import { cn } from "@/lib/utils";
import {
  DATA_GRID_CELL,
  DATA_GRID_HEAD,
  DATA_GRID_ROW,
  DATA_GRID_TABLE,
} from "@/components/ui/data-grid";

interface CompetitionTableProps {
  upcoming: Competition[];
  past: Competition[];
  searchQuery?: string;
}

function CompetitionRow({ competition }: { competition: Competition }) {
  const href = `/competitions/${competition.id}`;

  return (
    <TableRow className={DATA_GRID_ROW}>
      <TableCell className={cn(DATA_GRID_CELL, "whitespace-nowrap")}>
        <div className="flex items-center gap-2">
          <a href={href} className="font-medium text-foreground hover:text-primary">
            {competition.name}
          </a>
          <CompetitionStatusBadge
            startDate={competition.start_date}
            endDate={competition.end_date}
            hasResults={competition.has_results}
            cancelledAt={competition.cancelled_at}
          />
        </div>
      </TableCell>
      <TableCell className={cn(DATA_GRID_CELL, "whitespace-nowrap tabular-nums")}>
        {formatCompetitionDateRange(competition.start_date, competition.end_date)}
      </TableCell>
      <TableCell className={cn(DATA_GRID_CELL, "whitespace-nowrap")}>
        {competition.city}
      </TableCell>
      <TableCell className={cn(DATA_GRID_CELL, "whitespace-nowrap")}>
        <div className="flex items-center justify-end gap-1.5">
          {competition.event_ids.map((event: string) => (
            <EventIcon key={`${competition.id}-${event}`} eventId={event} className="text-base" />
          ))}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function CompetitionTable({
  upcoming,
  past,
  searchQuery = "",
}: CompetitionTableProps) {
  const isSearch = searchQuery.trim().length > 0;

  return (
    <Table className={DATA_GRID_TABLE}>
      <TableHeader className="[&_tr]:border-0">
        <TableRow className={DATA_GRID_ROW}>
          <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD, "whitespace-nowrap")}>
            Name
          </TableHead>
          <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD, "w-[11.25rem] md:w-[13.75rem] whitespace-nowrap")}>
            Date
          </TableHead>
          <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD, "whitespace-nowrap")}>
            Location
          </TableHead>
          <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD, "text-right whitespace-nowrap")}>
            Events
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {upcoming.length > 0 ? (
          upcoming.map((competition) => (
            <CompetitionRow key={competition.id} competition={competition} />
          ))
        ) : (
          <TableRow className={DATA_GRID_ROW}>
            <TableCell
              colSpan={4}
              className={cn(DATA_GRID_CELL, "py-6 text-sm text-muted-foreground")}
            >
              {isSearch ? (
                <p>No upcoming competitions match your search.</p>
              ) : (
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    No upcoming competitions right now
                  </p>
                  <p>
                    Stay tuned — new Kerala competitions will show up here when
                    they&apos;re announced.
                  </p>
                </div>
              )}
            </TableCell>
          </TableRow>
        )}
        {past.map((competition) => (
          <CompetitionRow key={competition.id} competition={competition} />
        ))}
      </TableBody>
    </Table>
  );
}
