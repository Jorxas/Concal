"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Apple,
  Camera,
  Coffee,
  Loader2Icon,
  Moon,
  Soup,
  X,
} from "lucide-react";
import {
  clearDaySlot,
  setDaySlotFromQuickPhoto,
  setDaySlotMeal,
} from "@/app/(app)/dashboard/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { DAY_SLOTS, type DaySlot } from "@/lib/meals/day-slots";

export type DaySlotPickRow = {
  mealId: string;
  title: string;
  calories: number | null;
  imageUrl: string | null;
};

export type DaySlotFilled = {
  logId: string;
  mealId: string;
  title: string;
  calories: number | null;
  protein: number;
  carbs: number;
  fat: number;
};

export type DayMealSlotsDict = {
  title: string;
  subtitle: string;
  slotBreakfast: string;
  slotLunch: string;
  slotSnack: string;
  slotDinner: string;
  pickRecipe: string;
  changeRecipe: string;
  clearSlot: string;
  tabMine: string;
  tabSaved: string;
  tabPhoto: string;
  takePhoto: string;
  photoHint: string;
  photoAnalyzing: string;
  photoSlotUpdated: string;
  photoQuota: string;
  photoEstimateNote: string;
  emptyMine: string;
  emptySaved: string;
  slotUpdated: string;
  slotCleared: string;
  networkError: string;
};

const SLOT_ICONS: Record<DaySlot, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Soup,
  snack: Apple,
  dinner: Moon,
};

function slotLabel(slot: DaySlot, dict: DayMealSlotsDict): string {
  switch (slot) {
    case "breakfast":
      return dict.slotBreakfast;
    case "lunch":
      return dict.slotLunch;
    case "snack":
      return dict.slotSnack;
    case "dinner":
      return dict.slotDinner;
    default:
      return slot;
  }
}

type PickerTab = "mine" | "saved" | "photo";

export function DayMealSlots({
  filledBySlot,
  mine,
  saved,
  dict,
}: {
  filledBySlot: Partial<Record<DaySlot, DaySlotFilled>>;
  mine: DaySlotPickRow[];
  saved: DaySlotPickRow[];
  dict: DayMealSlotsDict;
}) {
  const router = useRouter();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<DaySlot | null>(null);
  const [tab, setTab] = useState<PickerTab>("mine");
  const [pending, startTransition] = useTransition();

  function openPicker(slot: DaySlot) {
    setActiveSlot(slot);
    setTab("mine");
    setDialogOpen(true);
  }

  function pickMeal(mealId: string) {
    if (!activeSlot) return;
    startTransition(async () => {
      try {
        const result = await setDaySlotMeal(activeSlot, mealId);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success(dict.slotUpdated);
        setDialogOpen(false);
        setActiveSlot(null);
        router.refresh();
      } catch {
        toast.error(dict.networkError);
      }
    });
  }

  function onPhotoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !activeSlot) return;
    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append("slot", activeSlot);
        fd.append("image", file);
        const result = await setDaySlotFromQuickPhoto(fd);
        if (!result.ok) {
          if (result.code === "gemini_quota") {
            toast.error(dict.photoQuota);
          } else {
            toast.error(result.error);
          }
          return;
        }
        toast.success(dict.photoSlotUpdated, {
          description: dict.photoEstimateNote,
        });
        setDialogOpen(false);
        setActiveSlot(null);
        router.refresh();
      } catch {
        toast.error(dict.networkError);
      }
    });
  }

  function clearSlot(slot: DaySlot) {
    startTransition(async () => {
      try {
        const result = await clearDaySlot(slot);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success(dict.slotCleared);
        router.refresh();
      } catch {
        toast.error(dict.networkError);
      }
    });
  }

  const list = tab === "mine" ? mine : saved;
  const emptyLabel = tab === "mine" ? dict.emptyMine : dict.emptySaved;

  function tabButton(
    id: PickerTab,
    label: string,
    isActive: boolean,
    onSelect: () => void,
  ) {
    return (
      <button
        type="button"
        className={cn(
          "relative min-w-0 flex-1 px-1 py-2.5 text-xs font-medium transition-colors sm:text-sm",
          isActive
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
        onClick={onSelect}
      >
        <span className="line-clamp-2">{label}</span>
        {isActive ? (
          <span className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-primary sm:inset-x-3" />
        ) : null}
      </button>
    );
  }

  return (
    <>
      <section
        className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm md:p-8"
        aria-labelledby="day-meals-heading"
      >
        <div>
          <h2
            id="day-meals-heading"
            className="font-heading text-xl tracking-tight md:text-2xl"
          >
            {dict.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{dict.subtitle}</p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {DAY_SLOTS.map((slot) => {
            const filled = filledBySlot[slot];
            const Icon = SLOT_ICONS[slot];
            return (
              <div
                key={slot}
                className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  {slotLabel(slot, dict)}
                </div>

                {filled ? (
                  <>
                    <div className="min-w-0">
                      <p className="truncate font-medium leading-snug">
                        {filled.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                        {filled.calories !== null
                          ? `${Math.round(filled.calories)} kcal`
                          : "—"}
                      </p>
                    </div>
                    <div className="mt-auto flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="rounded-full"
                        disabled={pending}
                        onClick={() => openPicker(slot)}
                      >
                        {dict.changeRecipe}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="rounded-full text-muted-foreground"
                        disabled={pending}
                        onClick={() => clearSlot(slot)}
                      >
                        <X className="mr-1 size-3.5" aria-hidden />
                        {dict.clearSlot}
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-auto h-10 w-full rounded-xl border-dashed"
                    disabled={pending}
                    onClick={() => openPicker(slot)}
                  >
                    {dict.pickRecipe}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setActiveSlot(null);
        }}
      >
        <DialogContent className="max-h-[min(90vh,32rem)] gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="border-b border-border/60 px-4 py-3">
            <DialogTitle className="text-left font-heading text-lg">
              {activeSlot ? slotLabel(activeSlot, dict) : ""}
            </DialogTitle>
          </DialogHeader>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            aria-hidden
            tabIndex={-1}
            onChange={onPhotoFileChange}
          />

          <div className="flex border-b border-border/60 px-1 sm:px-2">
            {tabButton("mine", dict.tabMine, tab === "mine", () =>
              setTab("mine"),
            )}
            {tabButton("saved", dict.tabSaved, tab === "saved", () =>
              setTab("saved"),
            )}
            {tabButton("photo", dict.tabPhoto, tab === "photo", () =>
              setTab("photo"),
            )}
          </div>

          <div className="max-h-[min(60vh,22rem)] overflow-y-auto p-2">
            {pending ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                <Loader2Icon className="size-8 animate-spin" aria-hidden />
                {tab === "photo" ? <span>{dict.photoAnalyzing}</span> : null}
              </div>
            ) : tab === "photo" ? (
              <div className="space-y-4 px-2 py-4">
                <p className="text-sm text-muted-foreground">{dict.photoHint}</p>
                <p className="text-xs text-muted-foreground">{dict.photoEstimateNote}</p>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 w-full gap-2 rounded-xl"
                  disabled={pending}
                  onClick={() => photoInputRef.current?.click()}
                >
                  <Camera className="size-4 shrink-0" aria-hidden />
                  {dict.takePhoto}
                </Button>
              </div>
            ) : list.length === 0 ? (
              <p className="px-3 py-10 text-center text-sm text-muted-foreground">
                {emptyLabel}
              </p>
            ) : (
              <ul className="space-y-1">
                {list.map((row) => (
                  <li key={`${tab}-${row.mealId}`}>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => pickMeal(row.mealId)}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted/60"
                    >
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {row.imageUrl ? (
                          <Image
                            src={row.imageUrl}
                            alt=""
                            fill
                            unoptimized
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium leading-snug">
                          {row.title}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {row.calories !== null
                            ? `${Math.round(row.calories)} kcal`
                            : "—"}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
