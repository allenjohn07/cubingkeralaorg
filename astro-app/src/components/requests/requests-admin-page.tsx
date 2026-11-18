import { useState } from "react";
import { toast } from "sonner";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { RoleSelect } from "./role-select";
import { AddMemberForm } from "./add-member-form";
import type { RequestInfo, RoleType } from "@/types/member";
import { cn } from "@/lib/utils";
import {
  DATA_GRID_CELL,
  DATA_GRID_HEAD,
  DATA_GRID_ROW,
  DATA_GRID_TABLE,
  DATA_GRID_WRAP,
} from "@/components/ui/data-grid";

interface RequestsAdminPageProps {
  initialRequests: RequestInfo[];
  initialMembers: RequestInfo[];
}

function sortByName(list: RequestInfo[]): RequestInfo[] {
  return [...list].sort((a, b) => a.name.localeCompare(b.name));
}

async function postJson(url: string, method: string, body?: unknown): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.ok) return { ok: true };
  const data = (await res.json().catch(() => ({}))) as { message?: string };
  return { ok: false, message: data.message ?? "Something went wrong" };
}

// No isAdmin/login-fallback check here — src/middleware.ts already redirects
// any non-admin away from /requests entirely before this component ever
// renders (every navigation is a full page load, so middleware re-runs
// every time; there's no client-router path that could bypass it).
export function RequestsAdminPage({ initialRequests, initialMembers }: RequestsAdminPageProps) {
  const [requests, setRequests] = useState<RequestInfo[]>(initialRequests);
  const [members, setMembers] = useState<RequestInfo[]>(initialMembers);
  // Role picked in a member row's dropdown but not yet saved — Update
  // commits it into `members`, so picking a role alone doesn't change
  // anything until you confirm.
  const [draftMemberRoles, setDraftMemberRoles] = useState<Record<string, RoleType>>({});
  // Reject and Delete are both irreversible removals — route both through
  // one shared confirm dialog instead of acting immediately on click.
  const [pendingRemoval, setPendingRemoval] = useState<{ type: "request" | "member"; wcaid: string; name: string } | null>(
    null,
  );
  // Tracks which wcaids have an API call in flight right now, so every
  // action button (Approve/Update directly, Reject/Delete via the confirm
  // dialog) can disable itself and can't be double-fired by rapid clicks.
  const [busyWcaids, setBusyWcaids] = useState<Set<string>>(new Set());

  const withBusy = async (wcaid: string, fn: () => Promise<void>) => {
    setBusyWcaids((prev) => new Set(prev).add(wcaid));
    try {
      await fn();
    } finally {
      setBusyWcaids((prev) => {
        const next = new Set(prev);
        next.delete(wcaid);
        return next;
      });
    }
  };

  const handleApprove = (wcaid: string) =>
    withBusy(wcaid, async () => {
      const request = requests.find((entry) => entry.wcaid === wcaid);
      if (!request) return;
      const result = await postJson("/api/approve-requests", "POST", request);
      if (!result.ok) {
        toast.error(result.message ?? "Failed to approve request");
        return;
      }
      toast.success(`${request.name.split("(")[0]} approved`);
      setMembers((prev) => [...prev, request]);
      setRequests((prev) => prev.filter((entry) => entry.wcaid !== wcaid));
    });

  const handleReject = (wcaid: string) =>
    withBusy(wcaid, async () => {
      const result = await postJson("/api/delete-request", "DELETE", { wcaid });
      if (!result.ok) {
        toast.error(result.message ?? "Failed to reject request");
        return;
      }
      toast.success("Request rejected");
      setRequests((prev) => prev.filter((entry) => entry.wcaid !== wcaid));
    });

  const handleRequestRoleChange = (wcaid: string, role: RoleType) => {
    setRequests((prev) => prev.map((entry) => (entry.wcaid === wcaid ? { ...entry, role } : entry)));
  };

  const handleMemberRoleSelect = (wcaid: string, role: RoleType) => {
    setDraftMemberRoles((prev) => ({ ...prev, [wcaid]: role }));
  };

  const handleUpdateMember = (wcaid: string) =>
    withBusy(wcaid, async () => {
      const role = draftMemberRoles[wcaid];
      if (role === undefined) return;
      const member = members.find((entry) => entry.wcaid === wcaid);
      if (!member) return;
      const result = await postJson("/api/update-members", "POST", { ...member, role });
      if (!result.ok) {
        toast.error(result.message ?? "Failed to update member");
        return;
      }
      toast.success(`${member.name.split("(")[0]} updated`);
      setMembers((prev) => prev.map((entry) => (entry.wcaid === wcaid ? { ...entry, role } : entry)));
      setDraftMemberRoles((prev) => {
        const { [wcaid]: _removed, ...rest } = prev;
        return rest;
      });
    });

  const handleDeleteMember = (wcaid: string) =>
    withBusy(wcaid, async () => {
      const result = await postJson("/api/delete-member", "DELETE", { wcaid });
      if (!result.ok) {
        toast.error(result.message ?? "Failed to delete member");
        return;
      }
      toast.success("Member deleted");
      setMembers((prev) => prev.filter((entry) => entry.wcaid !== wcaid));
      setDraftMemberRoles((prev) => {
        const { [wcaid]: _removed, ...rest } = prev;
        return rest;
      });
    });

  const confirmPendingRemoval = async () => {
    if (!pendingRemoval) return;
    if (pendingRemoval.type === "request") {
      await handleReject(pendingRemoval.wcaid);
    } else {
      await handleDeleteMember(pendingRemoval.wcaid);
    }
    setPendingRemoval(null);
  };

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Pending requests</h2>
        <div className={DATA_GRID_WRAP}>
          <Table className={DATA_GRID_TABLE}>
            <TableHeader className="[&_tr]:border-0">
              <TableRow className={DATA_GRID_ROW}>
                <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD)}>Name</TableHead>
                <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD, "w-[9.375rem]")}>WCA ID</TableHead>
                <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD, "w-[10rem]")}>Role</TableHead>
                <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD, "w-[11.25rem] text-right")}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow className={DATA_GRID_ROW}>
                  <TableCell colSpan={4} className={cn(DATA_GRID_CELL, "py-6 text-sm text-muted-foreground")}>
                    No pending requests.
                  </TableCell>
                </TableRow>
              ) : (
                sortByName(requests).map((request) => (
                  <TableRow key={request.wcaid} className={DATA_GRID_ROW}>
                    <TableCell className={cn(DATA_GRID_CELL, "whitespace-nowrap font-medium")}>
                      {request.name.split("(")[0]}
                    </TableCell>
                    <TableCell className={DATA_GRID_CELL}>
                      <a
                        href={`https://www.worldcubeassociation.org/persons/${request.wcaid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-muted-foreground hover:text-primary"
                      >
                        {request.wcaid}
                      </a>
                    </TableCell>
                    <TableCell className={DATA_GRID_CELL}>
                      <RoleSelect
                        value={request.role}
                        onChange={(role) => handleRequestRoleChange(request.wcaid, role)}
                      />
                    </TableCell>
                    <TableCell className={cn(DATA_GRID_CELL, "text-right")}>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          disabled={busyWcaids.has(request.wcaid)}
                          onClick={() => handleApprove(request.wcaid)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={busyWcaids.has(request.wcaid)}
                          onClick={() =>
                            setPendingRemoval({ type: "request", wcaid: request.wcaid, name: request.name })
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Members</h2>
          <AddMemberForm onAdded={() => window.location.reload()} />
        </div>
        <div className={DATA_GRID_WRAP}>
          <Table className={DATA_GRID_TABLE}>
            <TableHeader className="[&_tr]:border-0">
              <TableRow className={DATA_GRID_ROW}>
                <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD)}>Name</TableHead>
                <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD, "w-[9.375rem]")}>WCA ID</TableHead>
                <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD, "w-[10rem]")}>Role</TableHead>
                <TableHead className={cn(DATA_GRID_CELL, DATA_GRID_HEAD, "w-[11.25rem] text-right")}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow className={DATA_GRID_ROW}>
                  <TableCell colSpan={4} className={cn(DATA_GRID_CELL, "py-6 text-sm text-muted-foreground")}>
                    No active members.
                  </TableCell>
                </TableRow>
              ) : (
                sortByName(members).map((member) => {
                  const draftRole = draftMemberRoles[member.wcaid];
                  const isDirty = draftRole !== undefined && draftRole !== member.role;

                  return (
                    <TableRow key={member.wcaid} className={DATA_GRID_ROW}>
                      <TableCell className={cn(DATA_GRID_CELL, "whitespace-nowrap font-medium")}>
                        <a href={`/members/${member.wcaid}`} className="hover:text-primary">
                          {member.name.split("(")[0]}
                        </a>
                      </TableCell>
                      <TableCell className={DATA_GRID_CELL}>
                        <a
                          href={`https://www.worldcubeassociation.org/persons/${member.wcaid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-muted-foreground hover:text-primary"
                        >
                          {member.wcaid}
                        </a>
                      </TableCell>
                      <TableCell className={DATA_GRID_CELL}>
                        <RoleSelect
                          value={draftRole ?? member.role}
                          onChange={(role) => handleMemberRoleSelect(member.wcaid, role)}
                        />
                      </TableCell>
                      <TableCell className={cn(DATA_GRID_CELL, "text-right")}>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={!isDirty || busyWcaids.has(member.wcaid)}
                            onClick={() => handleUpdateMember(member.wcaid)}
                          >
                            Update
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={busyWcaids.has(member.wcaid)}
                            onClick={() =>
                              setPendingRemoval({ type: "member", wcaid: member.wcaid, name: member.name })
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={pendingRemoval !== null} onOpenChange={(open) => !open && setPendingRemoval(null)}>
        <DialogContent>
          <DialogTitle>{pendingRemoval?.type === "request" ? "Reject this request?" : "Delete this member?"}</DialogTitle>
          <DialogDescription className="mt-2">
            {pendingRemoval?.type === "request"
              ? `${pendingRemoval?.name}'s membership request will be removed. This can't be undone.`
              : `${pendingRemoval?.name} will be removed from the members list. This can't be undone.`}
          </DialogDescription>
          <div className="mt-6 flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              size="sm"
              disabled={pendingRemoval !== null && busyWcaids.has(pendingRemoval.wcaid)}
              onClick={confirmPendingRemoval}
            >
              {pendingRemoval?.type === "request" ? "Reject" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
