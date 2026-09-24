import { cn } from "@/lib/utils";

export function Chip({
  label,
  selected,
  onClick,
  as = "button",
}: {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  as?: "button" | "span";
}) {
  const className = cn(
    "rounded-full border px-4 py-2 text-sm transition-all",
    selected
      ? "border-primary/40 bg-accent text-accent-foreground shadow-[0_6px_16px_-12px_oklch(0.5_0.1_20/60%)]"
      : "border-border bg-card text-muted-foreground",
  );
  if (as === "span") return <span className={className}>{label}</span>;
  return (
    <button type="button" onClick={onClick} className={cn(className, "active:scale-[0.97]")}>
      {label}
    </button>
  );
}
