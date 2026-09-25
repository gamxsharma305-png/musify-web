import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  icon: Icon,
  action,
  className,
}: {
  title: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between py-4", className)}>
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon ? <Icon className="size-5 shrink-0 text-primary" /> : null}
        <h2 className="truncate text-base font-semibold text-fg">{title}</h2>
      </div>
      {action}
    </div>
  );
}
