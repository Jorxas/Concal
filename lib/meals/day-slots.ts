export const DAY_SLOTS = ["breakfast", "lunch", "snack", "dinner"] as const;

export type DaySlot = (typeof DAY_SLOTS)[number];

export function isDaySlot(value: string): value is DaySlot {
  return (DAY_SLOTS as readonly string[]).includes(value);
}
