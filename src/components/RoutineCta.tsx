import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/** Prominent Build My Routine card, reusable across pages. */
export function RoutineCta() {
  const { lang } = useI18n();
  const de = lang === "de";
  return (
    <Link
      to="/my-routine"
      className="surface-lift gradient-dawn flex items-center justify-between gap-3 p-5 active:scale-[0.99] transition-transform"
    >
      <div>
        <p className="eyebrow flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" strokeWidth={1.7} />
          {de ? "8 einfache Fragen · persönlich" : "8 simple questions · personalized"}
        </p>
        <p className="mt-1 font-display text-2xl text-foreground">
          {de ? "Meine Routine erstellen" : "Build My Routine"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {de ? "Ein bestes Produkt für jeden Schritt." : "One best product for every step."}
        </p>
      </div>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full gradient-rose text-primary-foreground">
        <ArrowRight className="h-5 w-5" strokeWidth={1.7} />
      </span>
    </Link>
  );
}
