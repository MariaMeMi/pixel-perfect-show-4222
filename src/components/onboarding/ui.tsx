import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { Chip } from "@/components/Chip";

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-secondary" aria-hidden>
      <div className="h-full rounded-full gradient-rose transition-all duration-500 ease-out" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}

export function Question({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <h1 className="font-display text-3xl leading-tight text-foreground">{title}</h1>
      {hint && <p className="mt-2 text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

export function OptionCard({ label, text, icon, selected, onClick }: { label: string; text?: string; icon?: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center gap-3 rounded-3xl border p-4 text-left transition-all ${selected ? "border-primary bg-accent shadow-sm" : "border-border bg-card hover:border-primary/40"}`}
    >
      {icon && <span className="text-2xl" aria-hidden>{icon}</span>}
      <span className="flex-1">
        <span className="block text-[15px] font-medium text-foreground">{label}</span>
        {text && <span className="mt-0.5 block text-xs text-muted-foreground">{text}</span>}
      </span>
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${selected ? "border-primary gradient-rose text-primary-foreground" : "border-border"}`}>
        {selected && <Check className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}

export function SingleList({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return <div className="space-y-2">{options.map((o) => <OptionCard key={o} label={o} selected={value === o} onClick={() => onChange(o)} />)}</div>;
}

export function Chips({ options, value, onToggle }: { options: string[]; value: string[]; onToggle: (v: string) => void }) {
  return <div className="flex flex-wrap gap-2">{options.map((o) => <Chip key={o} label={o} selected={value.includes(o)} onClick={() => onToggle(o)} />)}</div>;
}
