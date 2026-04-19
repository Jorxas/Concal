"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { createMeal } from "@/app/(app)/meals/actions";
import type { AnalyzeFoodResponse } from "@/lib/validations/analyze-food-response";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Camera, ImagePlus, Loader2Icon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const INGREDIENTS_PLACEHOLDER = `[
  { "name": "Avocado", "amount": "1", "unit": "pcs" },
  { "name": "Eggs", "amount": "2", "unit": "pcs" }
]`;

export type MealFormDict = {
  sectionPhoto: string;
  sectionPhotoHelp: string;
  sectionDetails: string;
  sectionDetailsHelp: string;
  sectionMacros: string;
  sectionMacrosHelp: string;
  aiButton: string;
  aiAnalyzing: string;
  aiBadge: string;
  aiHint: string;
  aiLoading: string;
  aiFilled: string;
  aiFail: string;
  aiQuota: string;
  aiNetwork: string;
  pickPhotoFirst: string;
  publicLabel: string;
  publicHelp: string;
  submit: string;
  submitLoading: string;
  savingMeal: string;
  mealSaved: string;
  mealNetwork: string;
  titleLabel: string;
  titlePlaceholder: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  instructionsLabel: string;
  instructionsPlaceholder: string;
  ingredientsLabel: string;
  ingredientsHelp: string;
  categoryLabel: string;
  difficultyLabel: string;
  photoLabel: string;
  dropHint: string;
  caloriesLabel: string;
  proteinLabel: string;
  carbsLabel: string;
  fatLabel: string;
  cancel: string;
  category: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snack: string;
    dessert: string;
    drink: string;
    other: string;
  };
  difficulty: {
    easy: string;
    medium: string;
    hard: string;
  };
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function MealUploadForm({ dict }: { dict: MealFormDict }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [aiPending, setAiPending] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [category, setCategory] = useState("lunch");
  const [difficulty, setDifficulty] = useState("easy");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const onImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      setSelectedFile(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(file ? URL.createObjectURL(file) : null);
    },
    [previewUrl],
  );

  async function runAiAnalysis() {
    if (!selectedFile) {
      toast.error(dict.pickPhotoFirst);
      return;
    }
    setAiPending(true);
    const toastId = toast.loading(dict.aiLoading);
    try {
      const dataUrl = await readFileAsDataUrl(selectedFile);
      const res = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const body: unknown = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (
          res.status === 429 &&
          body &&
          typeof body === "object" &&
          (body as { code?: unknown }).code === "gemini_quota"
        ) {
          toast.error(dict.aiQuota, { id: toastId });
          return;
        }
        const msg =
          body &&
          typeof body === "object" &&
          "error" in body &&
          typeof (body as { error: unknown }).error === "string"
            ? (body as { error: string }).error
            : dict.aiFail;
        toast.error(msg, { id: toastId });
        return;
      }

      const d = body as AnalyzeFoodResponse;
      setTitle(d.title);
      setDescription(d.description);
      setIngredients(JSON.stringify(d.ingredients, null, 2));
      setCalories(String(Math.round(d.calories)));
      setProtein(String(d.protein));
      setCarbs(String(d.carbs));
      setFat(String(d.fat));
      toast.success(dict.aiFilled, { id: toastId });
    } catch {
      toast.error(dict.aiNetwork, { id: toastId });
    } finally {
      setAiPending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.append("title", title);
    fd.append("description", description);
    fd.append("instructions", instructions);
    fd.append("ingredients", ingredients);
    fd.append("category", category);
    fd.append("difficulty", difficulty);
    fd.append("calories_per_serving", calories);
    fd.append("protein_g_per_serving", protein);
    fd.append("carbs_g_per_serving", carbs);
    fd.append("fat_g_per_serving", fat);
    if (selectedFile) fd.append("image", selectedFile);
    fd.append("is_public", isPublic ? "true" : "false");

    const toastId = toast.loading(dict.savingMeal);
    setPending(true);
    try {
      const result = await createMeal(fd);
      if (!result.success) {
        toast.error(result.error, { id: toastId });
        return;
      }
      toast.success(dict.mealSaved, { id: toastId });
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error(dict.mealNetwork, { id: toastId });
    } finally {
      setPending(false);
    }
  }

  const disableForm = pending || aiPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <FormSection
        title={dict.sectionPhoto}
        help={dict.sectionPhotoHelp}
      >
        <label
          htmlFor="meal-image"
          className={cn(
            "group relative flex aspect-[16/10] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border/70 bg-muted/30 text-center transition-colors hover:border-primary/60 hover:bg-primary/5",
            previewUrl && "border-solid border-border/60 bg-transparent",
          )}
        >
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt=""
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 640px"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 p-6 text-muted-foreground">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ImagePlus className="size-6" aria-hidden />
              </span>
              <p className="text-sm font-medium text-foreground">
                {dict.photoLabel}
              </p>
              <p className="text-xs">{dict.dropHint}</p>
            </div>
          )}
          <input
            id="meal-image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={disableForm}
            onChange={onImageChange}
            className="sr-only"
          />
        </label>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            disabled={disableForm || !selectedFile}
            onClick={runAiAnalysis}
            className="h-11 gap-2 rounded-full px-5 text-sm"
          >
            {aiPending ? (
              <>
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
                {dict.aiAnalyzing}
              </>
            ) : (
              <>
                <Sparkles className="size-4" aria-hidden />
                {dict.aiButton}
              </>
            )}
            <span className="ml-1 rounded-full bg-primary-foreground/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide">
              {dict.aiBadge}
            </span>
          </Button>
          <p className="text-xs text-muted-foreground">
            <Camera className="mr-1 inline size-3.5 align-text-bottom" aria-hidden />
            {dict.aiHint}
          </p>
        </div>
      </FormSection>

      <FormSection
        title={dict.sectionDetails}
        help={dict.sectionDetailsHelp}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meal-title">{dict.titleLabel}</Label>
            <Input
              id="meal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              placeholder={dict.titlePlaceholder}
              disabled={disableForm}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meal-description">{dict.descriptionLabel}</Label>
            <Textarea
              id="meal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={dict.descriptionPlaceholder}
              disabled={disableForm}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meal-instructions">{dict.instructionsLabel}</Label>
            <Textarea
              id="meal-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              placeholder={dict.instructionsPlaceholder}
              disabled={disableForm}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meal-ingredients">{dict.ingredientsLabel}</Label>
            <Textarea
              id="meal-ingredients"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              rows={5}
              placeholder={INGREDIENTS_PLACEHOLDER}
              disabled={disableForm}
              className="font-mono text-xs md:text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {dict.ingredientsHelp}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{dict.categoryLabel}</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v ?? "lunch")}
                disabled={disableForm}
              >
                <SelectTrigger className="h-11 w-full min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">{dict.category.breakfast}</SelectItem>
                  <SelectItem value="lunch">{dict.category.lunch}</SelectItem>
                  <SelectItem value="dinner">{dict.category.dinner}</SelectItem>
                  <SelectItem value="snack">{dict.category.snack}</SelectItem>
                  <SelectItem value="dessert">{dict.category.dessert}</SelectItem>
                  <SelectItem value="drink">{dict.category.drink}</SelectItem>
                  <SelectItem value="other">{dict.category.other}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{dict.difficultyLabel}</Label>
              <Select
                value={difficulty}
                onValueChange={(v) => setDifficulty(v ?? "easy")}
                disabled={disableForm}
              >
                <SelectTrigger className="h-11 w-full min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">{dict.difficulty.easy}</SelectItem>
                  <SelectItem value="medium">{dict.difficulty.medium}</SelectItem>
                  <SelectItem value="hard">{dict.difficulty.hard}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card p-4">
            <div className="space-y-1">
              <Label htmlFor="meal-public" className="font-medium">
                {dict.publicLabel}
              </Label>
              <p className="text-xs text-muted-foreground">{dict.publicHelp}</p>
            </div>
            <Switch
              id="meal-public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
              disabled={disableForm}
            />
          </div>
        </div>
      </FormSection>

      <FormSection
        title={dict.sectionMacros}
        help={dict.sectionMacrosHelp}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="calories_per_serving">{dict.caloriesLabel}</Label>
            <Input
              id="calories_per_serving"
              type="number"
              min={1}
              max={20000}
              step={1}
              required
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              disabled={disableForm}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="protein_g_per_serving">{dict.proteinLabel}</Label>
            <Input
              id="protein_g_per_serving"
              type="number"
              min={0}
              max={2000}
              step={0.1}
              required
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              disabled={disableForm}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="carbs_g_per_serving">{dict.carbsLabel}</Label>
            <Input
              id="carbs_g_per_serving"
              type="number"
              min={0}
              max={2000}
              step={0.1}
              required
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              disabled={disableForm}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fat_g_per_serving">{dict.fatLabel}</Label>
            <Input
              id="fat_g_per_serving"
              type="number"
              min={0}
              max={2000}
              step={0.1}
              required
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              disabled={disableForm}
              className="h-11"
            />
          </div>
        </div>
      </FormSection>

      <div className="flex flex-wrap gap-3 border-t border-border/60 pt-6">
        <Button
          type="submit"
          disabled={disableForm}
          className="h-11 rounded-full px-6 text-sm shadow-sm"
        >
          {pending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
              {dict.submitLoading}
            </>
          ) : (
            dict.submit
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={disableForm}
          className="h-11 rounded-full px-5"
          onClick={() => router.push("/dashboard")}
        >
          {dict.cancel}
        </Button>
      </div>
    </form>
  );
}

function FormSection({
  title,
  help,
  children,
}: {
  title: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm md:p-7">
      <header className="mb-5">
        <h2 className="font-heading text-xl tracking-tight">{title}</h2>
        {help ? (
          <p className="mt-1 text-sm text-muted-foreground">{help}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
