type MediaRow = { storage_path: string; sort_order: number };

/** Première image d’un repas (tri `sort_order`). */
export function firstMealImagePath(
  media: MediaRow[] | null | undefined,
): string | null {
  if (!media?.length) return null;
  return [...media].sort((a, b) => a.sort_order - b.sort_order)[0]?.storage_path ?? null;
}
