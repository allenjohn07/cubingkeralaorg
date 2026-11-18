import { Badge } from "@/components/ui/badge";
import { getDetailedCompetitionStatus } from "@/utils/date-utils";

interface CompetitionStatusBadgeProps {
  startDate: string;
  endDate: string;
  hasResults: boolean;
  cancelledAt?: string | null;
}

export function CompetitionStatusBadge({
  startDate,
  endDate,
  hasResults,
  cancelledAt,
}: CompetitionStatusBadgeProps) {
  const status = getDetailedCompetitionStatus(startDate, endDate, hasResults, cancelledAt ?? null);

  // Purely a status label now, not a register shortcut — tables that show
  // this link to the competition's own detail page (via the name), which
  // has its own "Register for this competition" button when upcoming.
  if (status === "Upcoming") {
    return (
      <Badge
        variant="outline"
        className="border-none bg-primary/10 px-2 py-0 text-[0.6875rem] font-medium tracking-wide text-primary"
      >
        Upcoming
      </Badge>
    );
  }

  if (status === "Ongoing") {
    return (
      <Badge
        variant="outline"
        className="border-none bg-secondary px-2 py-0 text-[0.6875rem] font-medium tracking-wide text-secondary-foreground"
      >
        Ongoing
      </Badge>
    );
  }

  if (status === "Cancelled") {
    return (
      <Badge
        variant="outline"
        className="border-none bg-muted px-2 py-0 text-[0.6875rem] font-medium tracking-wide text-muted-foreground"
      >
        Cancelled
      </Badge>
    );
  }

  // Plain "Completed" renders nothing — it's the default/expected state for
  // a past competition, not something worth flagging next to every single
  // row in a list that's mostly past competitions.
  return null;
}
