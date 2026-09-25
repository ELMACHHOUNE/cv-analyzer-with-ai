import { Inbox } from "lucide-react";
import { Eyebrow } from "@/components/ui/text-link";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
  compact = false,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center border border-dashed border-hairline-strong bg-surface-soft text-center",
        compact ? "min-h-48 p-6" : "min-h-72 p-8",
        className,
      )}
    >
      <span className="grid h-12 w-12 place-items-center border border-hairline bg-canvas text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <Eyebrow className="mt-6 text-ink">{title}</Eyebrow>
      {description && (
        <p className="mt-3 max-w-2xl text-[14px] leading-[1.55] font-light text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
