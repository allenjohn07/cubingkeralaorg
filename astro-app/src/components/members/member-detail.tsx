import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PersonalRecordsTable } from "./personal-records-table";
import type { RequestInfo, MemberWcaSummary } from "@/types/member";
import type { RankingsWcaEntry, WcaTeamMembership } from "@/types/ranking";
import { capitalizeRole } from "@/utils/member-utils";
import { getTeamName, formatDelegateStatus } from "@/utils/wca-teams";
import { NAVBAR_CONTAINER_CLASS } from "@/components/layout/navbar/layout";

interface MemberDetailProps {
  member: RequestInfo;
  summary?: MemberWcaSummary;
  wcaData?: RankingsWcaEntry;
  tags?: { delegateStatus: string | null; teams: WcaTeamMembership[] };
}

// Label stacked above value — the sidebar is a fixed-width grid column, not
// a viewport-wide one, so the shared DetailRow's `sm:` breakpoint (which
// switches to a label-left/value-right row) doesn't know how narrow its
// actual container is and ends up squeezing the value into too little room.
function SidebarStat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="text-foreground">{children}</div>
    </div>
  );
}

export function MemberDetail({ member, summary, wcaData, tags }: MemberDetailProps) {
  const displayName = member.name.split("(")[0].trim();
  const localName = member.name.match(/\((.*?)\)/)?.[1];
  const isUnavailable = Boolean(wcaData?.isUnavailable);
  // WCA's own placeholder for accounts with no uploaded photo — treat the
  // same as "no avatar" rather than rendering their generic silhouette.
  const hasRealAvatar = member.avatarUrl && !member.avatarUrl.includes("missing_avatar_thumb");

  return (
    <div className={`py-6 sm:py-10 ${NAVBAR_CONTAINER_CLASS}`}>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[23.75rem_minmax(0,1fr)] lg:gap-16">
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-4">
            {hasRealAvatar ? (
              <img
                src={member.avatarUrl}
                alt={`${displayName}'s profile picture`}
                className="size-28 shrink-0 rounded-md border border-border object-cover lg:size-40 lg:rounded-xl"
              />
            ) : (
              <div className="flex size-28 shrink-0 items-center justify-center rounded-md border border-border bg-card text-2xl font-semibold text-muted-foreground lg:size-40 lg:rounded-xl lg:text-5xl">
                {displayName.slice(0, 1)}
              </div>
            )}
            <div className="flex min-w-0 flex-col gap-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">{displayName}</h1>
              <Badge className="w-fit px-2 py-0 text-[0.6875rem] font-medium tracking-wide">
                {capitalizeRole(member.role)}
              </Badge>
              {localName ? <p className="text-sm text-muted-foreground">{localName}</p> : null}
              <Button variant="link" className="h-auto w-fit px-0" asChild>
                <a
                  href={`https://www.worldcubeassociation.org/persons/${member.wcaid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {member.wcaid}
                  <ArrowUpRight />
                </a>
              </Button>
            </div>
          </div>

          {tags?.delegateStatus || tags?.teams.length ? (
            <div className="flex flex-wrap gap-1.5">
              {tags.delegateStatus && (
                <Badge
                  variant="secondary"
                  className="w-fit px-2 py-0 text-[0.6875rem] font-medium tracking-wide"
                >
                  {formatDelegateStatus(tags.delegateStatus)}
                </Badge>
              )}
              {tags.teams.map((team) => (
                <Badge
                  key={team.friendly_id}
                  variant="secondary"
                  className="w-fit px-2 py-0 text-[0.6875rem] font-medium tracking-wide"
                >
                  {getTeamName(team.friendly_id)}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="flex items-start gap-4">
            <SidebarStat label="Country">
              <span className="inline-flex items-center gap-2">
                {member.country}
                <span>🇮🇳</span>
              </span>
            </SidebarStat>
            <SidebarStat label="Competitions">
              {isUnavailable ? <span className="italic text-muted-foreground">N/A</span> : summary?.competition_count ?? 0}
            </SidebarStat>
            <SidebarStat label="Medals">
              {isUnavailable ? (
                <span className="italic text-muted-foreground">N/A</span>
              ) : (
                <span className="inline-flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-yellow-500" />
                    {summary?.medals.gold ?? 0}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-slate-400" />
                    {summary?.medals.silver ?? 0}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-yellow-800" />
                    {summary?.medals.bronze ?? 0}
                  </span>
                </span>
              )}
            </SidebarStat>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 lg:max-w-2xl lg:justify-self-end">
          <h2 className="text-lg font-semibold tracking-tight">Personal records</h2>
          {isUnavailable ? (
            <p className="text-sm text-muted-foreground md:text-base">
              WCA results for this ID aren&apos;t available yet.
            </p>
          ) : (
            <PersonalRecordsTable personalRecords={wcaData?.personal_records ?? {}} />
          )}
        </div>
      </div>
    </div>
  );
}
