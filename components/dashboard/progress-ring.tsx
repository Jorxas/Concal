import { cn } from "@/lib/utils";

type ProgressRingProps = {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: React.ReactNode;
  sublabel?: React.ReactNode;
  variant?: "primary" | "destructive";
};

export function ProgressRing({
  value,
  size = 164,
  strokeWidth = 12,
  className,
  label,
  sublabel,
  variant = "primary",
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(value, 1.2));
  const offset = circumference * (1 - Math.min(1, clamped));
  const strokeColor =
    variant === "destructive"
      ? "var(--destructive)"
      : "var(--primary)";

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--muted)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          fill="none"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center">
        <div className="font-heading text-3xl leading-none tracking-tight tabular-nums">
          {label}
        </div>
        {sublabel ? (
          <div className="text-xs text-muted-foreground tabular-nums">
            {sublabel}
          </div>
        ) : null}
      </div>
    </div>
  );
}
