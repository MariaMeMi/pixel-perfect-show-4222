import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, HeartHandshake, Lock, MessageCircle, Stethoscope } from "lucide-react";

export const Route = createFileRoute("/community/guidelines")({
  head: () => ({
    meta: [
      { title: "Community guidelines · Rose AI" },
      { name: "description", content: "The rules that keep the Rose AI community kind, safe and helpful." },
      { property: "og:title", content: "Community guidelines · Rose AI" },
      { property: "og:description", content: "The rules that keep the Rose AI community kind, safe and helpful." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GuidelinesPage,
});

const SECTIONS = [
  {
    icon: HeartHandshake,
    title: "Be kind",
    body: "Everyone here lives with sensitive skin. Share experiences and encouragement — never mock, shame or harass. Harassment, hate speech and personal attacks are removed and can lead to a ban.",
  },
  {
    icon: Stethoscope,
    title: "Experiences, not medical advice",
    body: "You may share what worked for you, but never tell others what treatment, medication or dose they should use, and never diagnose. Phrase things as “this helped me”, not “you should”. Persistent skin concerns deserve a qualified professional.",
  },
  {
    icon: Lock,
    title: "Protect privacy",
    body: "The community is pseudonymous. Don't share your email, phone number, address or full name — and never post anyone else's personal details or photos without their explicit permission.",
  },
  {
    icon: MessageCircle,
    title: "Keep it genuine",
    body: "No spam, advertising, affiliate links or self-promotion. Stay on topic for the category, and don't post the same message repeatedly.",
  },
] as const;

function GuidelinesPage() {
  return (
    <div className="space-y-5">
      <div>
        <Link to="/community" className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Community
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Community guidelines</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Rose AI Community is an educational, supportive space. It is not medical advice and doesn't replace a qualified
          professional.
        </p>
      </div>

      <div className="space-y-3">
        {SECTIONS.map((s) => (
          <div key={s.title} className="rounded-2xl border border-border bg-card p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <s.icon className="h-4 w-4 text-primary" /> {s.title}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
        <h2 className="text-sm font-semibold text-foreground">Reporting & moderation</h2>
        <p className="mt-1.5 leading-relaxed">
          Use the Report button on any post or comment. Moderators review reports and may hide content that breaks these
          rules. You can also block any member to hide their content from your view. Moderation decisions are logged.
        </p>
      </div>
    </div>
  );
}
