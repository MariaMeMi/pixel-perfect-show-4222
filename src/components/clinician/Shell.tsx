import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  ChartNoAxesCombined,
  Settings,
  ShieldCheck,
  Flower2,
  ArrowLeft,
  FolderOpen,
  Images,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
const tabs = [
  { to: "/clinician/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clinician/patients", label: "My Patients", icon: Users },
  { to: "/clinician/cases", label: "My Cases", icon: FolderOpen },
  { to: "/clinician/photos", label: "Photo Library", icon: Images },
  { to: "/clinician/progress", label: "Progress", icon: ChartNoAxesCombined },
  { to: "/clinician/settings", label: "Settings", icon: Settings },
] as const;
export function ClinicianShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="clinician-workspace min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-border bg-card p-6 md:flex md:flex-col">
        <Link to="/clinician/dashboard" className="flex items-center gap-3 text-xl font-semibold">
          <Flower2 className="text-primary" />
          Rose AI
        </Link>
        <p className="mt-2 text-sm text-muted-foreground">For Clinicians</p>
        <nav className="mt-10 space-y-2">
          {tabs.map((t) => (
            <Button
              key={t.to}
              asChild
              variant="ghost"
              className={cn(
                "w-full justify-start rounded-md",
                path.startsWith(t.to) && "bg-accent text-accent-foreground",
              )}
            >
              <Link to={t.to}>
                <t.icon />
                {t.label}
              </Link>
            </Button>
          ))}
        </nav>
        <div className="mt-auto space-y-3">
          <p className="text-xs text-muted-foreground">Early access · Unverified credentials</p>
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft />
              My skin workspace
            </Link>
          </Button>
        </div>
      </aside>
      <div className="md:ml-60">
        <header className="border-b border-border bg-card px-5 py-4 lg:px-10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold md:text-sm">
              Rose AI{" "}
              <span className="font-normal text-muted-foreground">/ Clinician workspace</span>
            </span>
            <span className="flex items-center gap-2 rounded-md bg-accent px-3 py-1 text-xs font-medium">
              <ShieldCheck className="size-4" />
              Test data only
            </span>
          </div>
          <nav className="mt-4 flex gap-1 overflow-x-auto md:hidden">
            {tabs.map((t) => (
              <Button key={t.to} variant="ghost" size="sm" asChild>
                <Link to={t.to}>
                  <t.icon />
                  {t.label}
                </Link>
              </Button>
            ))}
          </nav>
        </header>
        <div className="border-b border-border bg-secondary px-5 py-3 text-xs text-secondary-foreground lg:px-10">
          Early access: synthetic photos and non-identifying test records only. Do not enter real
          patient information.
        </div>
        <main className="mx-auto max-w-6xl px-5 py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-sans text-3xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center border-y border-dashed border-border px-4 py-12 text-center">
      <Users className="mb-4 size-8 text-muted-foreground" />
      <h2 className="font-sans text-lg font-semibold">{title}</h2>
      <p className="mb-5 mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}
