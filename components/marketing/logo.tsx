import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  markClassName?: string;
  label?: string;
};

export function Logo({ className, markClassName, label = "Concal" }: LogoProps) {
  return (
    <span className={cn("flex items-center gap-2 font-semibold", className)}>
      <span
        className={cn(
          "relative flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_8px_20px_-10px_oklch(0.62_0.15_160_/_0.6)]",
          markClassName,
        )}
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="size-4"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 3.5c2 2.3 4 4.8 4 8.2 0 3-2 5.8-4 5.8s-4-2.7-4-5.8c0-3.4 2-5.9 4-8.2z"
            fill="currentColor"
            opacity="0.95"
          />
          <circle cx="16.5" cy="6" r="1.6" fill="currentColor" />
        </svg>
      </span>
      <span className="font-heading text-lg tracking-tight">{label}</span>
    </span>
  );
}
