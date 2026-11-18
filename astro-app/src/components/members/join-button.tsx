import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JoinButtonProps {
  isLoggedIn: boolean;
  /** Already a Members row — disables the button instead of letting them
   * hit /api/join-cubingkerala's "Already a member" error needlessly. */
  isMember: boolean;
}

// Ported from the old Next.js app's MembersPageShell "Join Cubing Kerala"
// button, simplified: /api/join-cubingkerala now reads identity from the
// verified session cookie server-side (Phase 6 change), so this needs no
// request body — just POST and react to the result.
export function JoinButton({ isLoggedIn, isMember }: JoinButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Logged out: same label as the real button, so the call to action reads
  // the same for everyone — clicking it just explains that login comes first.
  if (!isLoggedIn) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => toast.info("Login to join")}
      >
        Join Cubing Kerala
      </Button>
    );
  }

  if (isMember) {
    return (
      <Button variant="outline" size="sm" disabled>
        Already a member
      </Button>
    );
  }

  const handleJoin = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/join-cubingkerala", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        toast.error(data.message ?? "Failed to join");
        return;
      }
      toast.success(data.message ?? "Request submitted");
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      toast.error("Failed to join — please try again");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleJoin} disabled={isLoading}>
      {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Join Cubing Kerala"}
    </Button>
  );
}
