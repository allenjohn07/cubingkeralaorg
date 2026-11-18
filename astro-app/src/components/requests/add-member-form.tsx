import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoleSelect } from "./role-select";
import type { RoleType } from "@/types/member";

interface AddMemberFormProps {
  onAdded: (name: string) => void;
}

/**
 * Admin shortcut: add a member directly by WCA ID, no request/approve step.
 * The WCA ID alone is enough — /api/admin-add-member fetches name, avatar,
 * country, gender, and their WCA competitor data (so rankings show up
 * immediately) from the live WCA API, same lookup the sync job uses.
 */
export function AddMemberForm({ onAdded }: AddMemberFormProps) {
  const [wcaid, setWcaid] = useState("");
  const [role, setRole] = useState<RoleType>("member");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin-add-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wcaid: wcaid.trim().toUpperCase(), role }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string; name?: string };
      if (!res.ok) {
        toast.error(data.message ?? "Failed to add member");
        return;
      }
      toast.success(`${data.name ?? "Member"} added successfully`);
      setWcaid("");
      setRole("member");
      // Same reasoning as RefreshButton — onAdded() triggers a page reload
      // in the parent, which would otherwise tear the toast down before it
      // ever gets to paint.
      setTimeout(() => onAdded(data.name ?? data.message ?? "Member added"), 800);
    } catch {
      toast.error("Failed to add member — please try again");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <Input
        value={wcaid}
        onChange={(event) => setWcaid(event.target.value)}
        placeholder="WCA ID, e.g. 2023TEST01"
        className="h-9 w-[12.5rem]"
        required
      />
      <RoleSelect value={role} onChange={setRole} />
      <Button type="submit" size="sm" disabled={isLoading || wcaid.trim().length === 0}>
        {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Add member"}
      </Button>
    </form>
  );
}
