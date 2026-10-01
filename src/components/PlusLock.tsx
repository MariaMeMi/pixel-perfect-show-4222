import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";

export function PlusLock({ title }: { title: string }) {
  return (
    <Link to="/plus" className="surface flex items-center gap-3 p-4 text-sm">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
        <Lock className="h-4 w-4" strokeWidth={1.7} />
      </span>
      <span className="flex-1">
        <span className="block text-foreground">{title}</span>
        <span className="block text-xs text-muted-foreground">Included with Rosea Plus 🌹</span>
      </span>
      <span className="text-xs font-medium text-primary">Unlock</span>
    </Link>
  );
}
