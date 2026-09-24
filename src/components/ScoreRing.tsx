import { useI18n } from "@/lib/i18n";
import { labelForScore } from "@/lib/storage";

export function scoreLabelKey(score: number) {
  return `score.${labelForScore(score)}` as const;
}

export function ScoreRing({ score, size = 168 }: { score: number; size?: number }) {
  const { t } = useI18n();
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, score)) / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="roseaRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e8bfae" />
            <stop offset="100%" stopColor="#c2635f" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-secondary)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#roseaRing)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 900ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-5xl leading-none text-foreground">{score}</span>
        <span className="mt-1 text-xs text-muted-foreground">/ 100</span>
        <span className="mt-2 max-w-[8rem] text-center text-[0.7rem] leading-snug text-primary">
          {t(scoreLabelKey(score))}
        </span>
      </div>
    </div>
  );
}
