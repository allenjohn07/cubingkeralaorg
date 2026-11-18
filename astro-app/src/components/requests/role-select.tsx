import { ChevronDownIcon } from "@radix-ui/react-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { capitalizeRole } from "@/utils/member-utils";
import type { RoleType } from "@/types/member";

const ROLES: RoleType[] = ["member", "organiser", "co-founder"];

interface RoleSelectProps {
  value: string;
  onChange: (role: RoleType) => void;
}

/** Same bordered-trigger pattern as the rankings event filter, sized for a table cell. */
export function RoleSelect({ value, onChange }: RoleSelectProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-8 w-[8.75rem] shrink-0 items-center justify-between gap-1.5 rounded-md border border-input bg-background px-2.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
        <span className="truncate">{capitalizeRole(value)}</span>
        <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup value={value} onValueChange={(role) => onChange(role as RoleType)}>
          {ROLES.map((role) => (
            <DropdownMenuRadioItem key={role} value={role}>
              {capitalizeRole(role)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
