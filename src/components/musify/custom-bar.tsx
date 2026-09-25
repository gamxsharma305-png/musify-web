import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function CustomBar({
  title,
  icon: Icon,
  description,
  onClick,
  trailing,
  radius = "none",
}: {
  title: string;
  icon: LucideIcon;
  description?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
  radius?: "first" | "last" | "none" | "all";
}) {
  const radiusClass =
    radius === "first"
      ? "rounded-t-lg"
      : radius === "last"
        ? "rounded-b-lg"
        : radius === "all"
          ? "rounded-lg"
          : "";
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick();
            }
          : undefined
      }
      className={cn(
        "flex w-full items-center gap-3.5 bg-surface-low px-3 py-2.5 text-left",
        radiusClass,
        onClick ? "cursor-pointer" : "",
      )}
    >
      <span className="cookie-shape flex size-[52px] shrink-0 items-center justify-center bg-secondary-container text-on-secondary-container">
        <Icon className="size-[26px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-primary">
          {title}
        </span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-snug text-muted">
            {description}
          </span>
        ) : null}
      </span>
      {trailing}
    </div>
  );
}
