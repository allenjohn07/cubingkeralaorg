import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { CompetitionStatusBadge } from "@/components/competitions/status-badge";
import { EventIcon } from "@/components/shared/event-icon";
import { formatCompetitionDateRange } from "@/utils/date-utils";
import { cn } from "@/lib/utils";
import {
  DATA_GRID_CELL,
  DATA_GRID_HEAD,
  DATA_GRID_ROW,
  DATA_GRID_TABLE,
  DATA_GRID_WRAP,
} from "@/components/ui/data-grid";
import type { Competition } from "@/types/competition";

function CompetitionsPreviewTable({
  competitions,
  emptyMessage,
}: {
  competitions: Competition[];
  emptyMessage: string;
}) {
  return (
    <div className={DATA_GRID_WRAP}>
      <Table className={DATA_GRID_TABLE}>
        <TableHeader className="[&_tr]:border-0">
          <TableRow className={DATA_GRID_ROW}>
            <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD)}>Name</TableHead>
            <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD, "w-[9.375rem] whitespace-nowrap")}>Date</TableHead>
            <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD, "whitespace-nowrap")}>Location</TableHead>
            <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD, "text-right")}>Events</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {competitions.length === 0 ? (
            <TableRow className={DATA_GRID_ROW}>
              <TableCell colSpan={4} className={cn(DATA_GRID_CELL, "py-6 text-sm text-muted-foreground")}>
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            competitions.map((competition) => (
              <TableRow key={competition.id} className={DATA_GRID_ROW}>
                <TableCell className={cn(DATA_GRID_CELL, "whitespace-nowrap")}>
                  <div className="flex items-center gap-2">
                    <a href={`/competitions/${competition.id}`} className="font-medium text-foreground hover:text-primary">
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
                <TableCell className={cn(DATA_GRID_CELL, "whitespace-nowrap")}>{competition.city}</TableCell>
                <TableCell className={cn(DATA_GRID_CELL, "whitespace-nowrap")}>
                  <div className="flex items-center justify-end gap-1.5">
                    {competition.event_ids.map((event) => (
                      <EventIcon key={event} eventId={event} className="text-base" />
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function UpcomingCompetitionsSection({ upcoming }: { upcoming: Competition[] }) {
  return (
    <section>
      <h2 className="mb-1.5 text-sm font-medium">Upcoming competitions</h2>
      <p className="mb-5 text-muted-foreground">Each is a full day of official rounds, open to all ages.</p>
      <CompetitionsPreviewTable
        competitions={upcoming}
        emptyMessage="No upcoming competitions right now. Check back soon."
      />
    </section>
  );
}

export function PastCompetitionsSection({ past }: { past: Competition[] }) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-medium">Past competitions</h3>
      <div className="relative">
        <CompetitionsPreviewTable competitions={past} emptyMessage="No past competitions yet." />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 rounded-b-md bg-gradient-to-b from-transparent to-background"
        />
      </div>
      <p className="mt-3 text-sm">
        <a href="/competitions" className="text-primary hover:underline">
          View all competitions →
        </a>
      </p>
    </section>
  );
}
