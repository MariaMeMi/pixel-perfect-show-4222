import { useI18n } from "@/lib/i18n";
import type { RegionKey } from "@/lib/types";

const spots: { key: RegionKey; cx: number; cy: number; rx: number; ry: number }[] = [
  { key: "forehead", cx: 100, cy: 52, rx: 44, ry: 24 },
  { key: "leftCheek", cx: 58, cy: 118, rx: 28, ry: 26 },
  { key: "rightCheek", cx: 142, cy: 118, rx: 28, ry: 26 },
  { key: "nose", cx: 100, cy: 112, rx: 15, ry: 26 },
  { key: "chin", cx: 100, cy: 178, rx: 24, ry: 16 },
];

function intensity(value: number) {
  return Math.min(0.85, 0.08 + (value / 100) * 0.8);
}

export function FaceMap({ regions }: { regions: Record<RegionKey, number> }) {
  const { t } = useI18n();
  const sorted = [...spots].sort((a, b) => regions[b.key] - regions[a.key]);

  return (
    <div className="flex flex-col items-center gap-5">
      <svg viewBox="0 0 200 230" className="w-52" role="img" aria-label="Face redness map">
        <defs>
          <filter id="roseaBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>
        <path
          d="M100 14c34 0 60 26 60 62 0 14-2 26-5 38-6 26-20 52-36 70-6 7-13 11-19 11s-13-4-19-11c-16-18-30-44-36-70-3-12-5-24-5-38 0-36 26-62 60-62z"
          fill="var(--color-sand)"
          stroke="var(--color-border)"
          strokeWidth="1.5"
        />
        <g filter="url(#roseaBlur)">
          {spots.map((s) => (
            <ellipse
              key={s.key}
              cx={s.cx}
              cy={s.cy}
              rx={s.rx}
              ry={s.ry}
              fill="oklch(0.62 0.17 20)"
              opacity={intensity(regions[s.key] ?? 0)}
            />
          ))}
        </g>
        <ellipse cx="72" cy="86" rx="7" ry="4" fill="var(--color-muted-foreground)" opacity="0.5" />
        <ellipse cx="128" cy="86" rx="7" ry="4" fill="var(--color-muted-foreground)" opacity="0.5" />
        <path
          d="M86 160c9 6 19 6 28 0"
          fill="none"
          stroke="var(--color-muted-foreground)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>

      <ul className="w-full space-y-2.5">
        {sorted.map((s) => (
          <li key={s.key} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs text-muted-foreground">
              {t(`region.${s.key}` as const)}
            </span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
              <span
                className="block h-full rounded-full gradient-rose"
                style={{ width: `${Math.min(100, regions[s.key] ?? 0)}%` }}
              />
            </span>
            <span className="w-7 text-right text-xs tabular-nums text-foreground">
              {Math.round(regions[s.key] ?? 0)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
