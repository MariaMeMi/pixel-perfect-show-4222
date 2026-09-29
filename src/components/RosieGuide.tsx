import rosieImage from "@/assets/rosie-guide.png";

const guidance: Record<string, string> = {
  welcome: "Hi, I’m Rosie. I’ll stay with you while we create a simple starting point for your skin.",
  goals: "There’s no perfect answer—choose what you genuinely want to understand or track.",
  reflection: "You’re doing beautifully. I’ve organized your answers so your future check-ins have useful context.",
  baseline: "Use soft, even light and relax your face. This is a private Day 1 reference, not a diagnostic photo.",
  signup: "An account lets your Day 1 and our conversation follow you across devices. You can also continue without one.",
  building: "I’m reading only what is visibly present in this photo and preparing your Day 1.",
  gate: "Your results are ready. Your email unlocks them and receives a copy—your photo is not included in analytics.",
  profile: "This is your starting point, not a diagnosis. Future check-ins are what make your timeline meaningful.",
};

export function RosieGuide({ step }: { step: string }) {
  const text = guidance[step] ?? "I’m right here. Answer only what feels comfortable—you can always go back.";
  return (
    <aside className="mb-5 flex items-center gap-3" aria-label="Guidance from Rosie AI">
      <img src={rosieImage} alt="Rosie, Rose AI's guide" width={1024} height={1024} className="h-16 w-16 shrink-0 object-contain" />
      <div className="relative rounded-md border border-border bg-card px-4 py-3 shadow-sm">
        <p className="eyebrow">Rosie AI</p>
        <p className="mt-1 text-sm leading-relaxed text-foreground">{text}</p>
      </div>
    </aside>
  );
}