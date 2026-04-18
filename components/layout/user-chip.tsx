import { LogOut } from "lucide-react";
import { signOut } from "@/app/(app)/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UserChipProps = {
  email: string | null;
  signOutLabel: string;
  className?: string;
};

function initialsFromEmail(email: string | null): string {
  if (!email) return "?";
  const local = email.split("@")[0] ?? email;
  const parts = local.split(/[._-]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? local[0] ?? "?";
  const second = parts[1]?.[0] ?? "";
  return `${first}${second}`.slice(0, 2).toUpperCase();
}

export function UserChip({ email, signOutLabel, className }: UserChipProps) {
  const initials = initialsFromEmail(email);
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border/60 bg-card/70 p-2.5",
        className,
      )}
    >
      <span
        aria-hidden
        className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary"
      >
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">
          {email ?? "—"}
        </p>
      </div>
      <form action={signOut}>
        <Button
          type="submit"
          variant="ghost"
          size="icon-sm"
          aria-label={signOutLabel}
          title={signOutLabel}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="size-4" aria-hidden />
        </Button>
      </form>
    </div>
  );
}
