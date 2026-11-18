import { useState } from "react";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FilterState } from "@/types/ranking";
import { getEventName, RANKED_EVENT_IDS } from "@/utils/event-names";
import { cn } from "@/lib/utils";

/** Matches the outline `Button` variant — bordered, bg-background, same hover treatment. */
const TRIGGER_CLASS =
  "flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground";

interface FilterComponentProps {
  onFilterChange: (filter: FilterState) => void;
  /** Override for the trigger's text size — the home preview sits next to a much smaller title than the full /rankings page. */
  triggerClassName?: string;
  /** Override for just the Event trigger's width — the Round trigger is already sized to its own short text. */
  eventWidthClassName?: string;
}

export function FilterComponent({
  onFilterChange,
  triggerClassName,
  eventWidthClassName = "w-[8.125rem] sm:w-[10rem]",
}: FilterComponentProps) {
  const [filter, setFilter] = useState<FilterState>({ event: "333", round: "single" });

  const update = (next: Partial<FilterState>) => {
    const merged = { ...filter, ...next };
    setFilter(merged);
    onFilterChange(merged);
  };

  return (
    <div className="flex shrink-0 items-center gap-2">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          className={cn(TRIGGER_CLASS, eventWidthClassName, "justify-between", triggerClassName)}
          aria-label="Event"
        >
          <span className="truncate">{getEventName(filter.event)}</span>
          <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
          <DropdownMenuRadioGroup value={filter.event} onValueChange={(event) => update({ event })}>
            {RANKED_EVENT_IDS.map((id) => (
              <DropdownMenuRadioItem key={id} value={id}>
                {getEventName(id)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger className={cn(TRIGGER_CLASS, "capitalize", triggerClassName)} aria-label="Round">
          <span>{filter.round}</span>
          <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup value={filter.round} onValueChange={(round) => update({ round })}>
            <DropdownMenuRadioItem value="single">Single</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="average">Average</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
