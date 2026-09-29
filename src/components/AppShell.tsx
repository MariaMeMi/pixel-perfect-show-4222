import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Camera, Home, LineChart, BookOpen, Sparkles, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { RosieChat } from "@/components/RosieChat";

const tabs = [
  { to: "/", icon: Home, key: "nav.home" },
  { to: "/analyze", icon: Camera, key: "nav.analyze" },
  { to: "/my-routine", icon: Sparkles, key: "nav.routine" },
  { to: "/progress", icon: LineChart, key: "nav.progress" },
  { to: "/learn", icon: BookOpen, key: "nav.learn" },
  { to: "/profile", icon: User, key: "nav.profile" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isOnboarding = pathname === "/onboarding" || pathname === "/welcome";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[30rem] flex-col bg-background">
      <main className={cn("flex-1 px-5 pt-8", isOnboarding ? "pb-8" : "pb-32")}>{children}</main>

      {!isOnboarding && <RosieChat />}

      {!isOnboarding && <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[30rem] border-t border-border/70 bg-card/90 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <ul className="flex items-stretch justify-between">
          {tabs.map(({ to, icon: Icon, key }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <li key={to} className="flex-1">
                <Link
                  to={to}
                  className={cn(
                    "flex flex-col items-center gap-1 py-3 text-[0.6875rem] transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-12 items-center justify-center rounded-full transition-colors",
                      active && "bg-accent",
                    )}
                  >
                    <Icon className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.6} />
                  </span>
                  {t(key)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>}
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-[2rem] leading-tight text-foreground">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
    </header>
  );
}
