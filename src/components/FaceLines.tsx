import { useId } from "react";
import type { LineArea, LineLevel } from "@/lib/botox";

type LineRegions = Record<LineArea, { level: LineLevel; noticed: string }>;

const LEVEL_WEIGHT: Record<LineLevel, number> = { not_prominent: 1, visible_with_expression: 2, visible_at_rest: 3 };

/** Facial-line map shared by the four-expression reading and the Day 1 baseline. */
export function FaceLines({ analysis, active, onTap }: {
  analysis: LineRegions | null;
  active: LineArea | null;
  onTap: (area: LineArea) => void;
}) {
  const gradientId = useId().replace(/:/g, "");
  const op = (area: LineArea) => analysis ? 0.18 + LEVEL_WEIGHT[analysis[area].level] * 0.14 : 0.15;
  const zone = (area: LineArea) => active === area ? "stroke-primary" : "stroke-transparent";

  return (
    <svg viewBox="0 0 200 260" className="h-full w-full" role="img" aria-label="Map of visible facial lines">
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="100" cy="130" rx="78" ry="108" fill="var(--color-sand)" stroke="var(--color-border)" strokeWidth="1.5" />
      <path d="M62 104 q14 -8 28 0 M110 104 q14 -8 28 0" stroke="var(--color-clay)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M66 122 q10 -6 20 0 M114 122 q10 -6 20 0" stroke="var(--color-clay)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M100 128 v28 q-6 6 0 8" stroke="var(--color-clay)" strokeWidth="1.3" fill="none" />
      <path d="M82 190 q18 10 36 0" stroke="var(--color-primary)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <g onClick={() => onTap("forehead")} className="cursor-pointer" role="button" tabIndex={0} aria-label="Forehead lines" onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onTap("forehead"); } }}>
        <ellipse cx="100" cy="62" rx="52" ry="26" fill={`url(#${gradientId})`} opacity={op("forehead")} />
        <path d="M70 55 q30 -6 60 0 M74 67 q26 -5 52 0" stroke="var(--color-primary)" strokeWidth="1" fill="none" opacity="0.7" />
        <ellipse cx="100" cy="62" rx="56" ry="30" fill="transparent" strokeWidth="1.5" strokeDasharray="4 4" className={zone("forehead")} />
      </g>
      <g onClick={() => onTap("glabella")} className="cursor-pointer" role="button" tabIndex={0} aria-label="Frown lines" onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onTap("glabella"); } }}>
        <ellipse cx="100" cy="100" rx="14" ry="14" fill={`url(#${gradientId})`} opacity={op("glabella")} />
        <path d="M96 92 v14 M104 92 v14" stroke="var(--color-primary)" strokeWidth="1" opacity="0.7" />
        <circle cx="100" cy="100" r="17" fill="transparent" strokeWidth="1.5" strokeDasharray="4 4" className={zone("glabella")} />
      </g>
      <g onClick={() => onTap("eyes")} className="cursor-pointer" role="button" tabIndex={0} aria-label="Eye-area lines" onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onTap("eyes"); } }}>
        {[46, 154].map((x) => <g key={x}>
          <ellipse cx={x} cy="122" rx="14" ry="16" fill={`url(#${gradientId})`} opacity={op("eyes")} />
          <path d={x < 100 ? `M${x + 6} 116 l-10 -4 M${x + 6} 122 l-11 0 M${x + 6} 128 l-10 4` : `M${x - 6} 116 l10 -4 M${x - 6} 122 l11 0 M${x - 6} 128 l10 4`} stroke="var(--color-primary)" strokeWidth="1" opacity="0.7" />
          <ellipse cx={x} cy="122" rx="17" ry="19" fill="transparent" strokeWidth="1.5" strokeDasharray="4 4" className={zone("eyes")} />
        </g>)}
      </g>
    </svg>
  );
}