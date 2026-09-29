import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { buildPlan, budgetTier, type Answers } from "@/lib/routine/engine";
import { DISCLAIMER, PlanView, ROUTINE_KEY, useProducts } from "./routine";

export const Route = createFileRoute("/my-routine")({
  head: () => ({
    meta: [
      { title: "My Routine — Rose AI" },
      { name: "description", content: "Your saved personalized morning and evening skincare routine." },
      { property: "og:title", content: "My Routine — Rose AI" },
      { property: "og:description", content: "Your saved skin plan, routine and product picks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyRoutine,
});

type Saved = { answers: Answers; chosen: Record<string, string>; savedAt: string };

function MyRoutine() {
  const [saved, setSaved] = useState<Saved | null>();
  const products = useProducts();
  useEffect(() => {
    try { setSaved(JSON.parse(localStorage.getItem(ROUTINE_KEY) ?? "null")); } catch { setSaved(null); }
  }, []);
  const plan = useMemo(() => (saved ? buildPlan(saved.answers) : null), [saved]);
  const [chosen, setChosen] = useState<Record<string, string>>({});
  useEffect(() => { if (saved) setChosen(saved.chosen); }, [saved]);
  const update = (c: Record<string, string>) => {
    setChosen(c);
    if (saved) localStorage.setItem(ROUTINE_KEY, JSON.stringify({ ...saved, chosen: c }));
  };

  if (saved === undefined) return null;
  if (!saved || !plan) return (
    <div className="mx-auto max-w-md pt-10 text-center">
      <h1 className="font-display text-3xl text-foreground">No routine saved yet</h1>
      <Link to="/routine" className="mt-6 inline-block rounded-full gradient-rose px-6 py-3.5 text-sm font-medium text-primary-foreground">Build My Routine</Link>
    </div>
  );
  return (
    <div className="mx-auto max-w-md space-y-6 pb-10">
      <p className="eyebrow pt-2">My Routine · saved {new Date(saved.savedAt).toLocaleDateString()}</p>
      <PlanView plan={plan} products={products} budget={budgetTier(saved.answers.budget)} chosen={chosen} setChosen={update} />
      <Link to="/routine" className="block rounded-full border border-border bg-card py-3.5 text-center text-sm font-medium text-foreground">Rebuild my routine</Link>
      <p className="text-[0.7rem] leading-relaxed text-muted-foreground">{DISCLAIMER}</p>
    </div>
  );
}
