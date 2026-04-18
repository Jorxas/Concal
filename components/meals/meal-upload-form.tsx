"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { createMeal } from "@/app/(app)/meals/actions";
import type { AnalyzeFoodResponse } from "@/lib/validations/analyze-food-response";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Camera, Loader2Icon, Sparkles } from "lucide-react";

const INGREDIENTS_PLACEHOLDER = `[
  { "name": "Avocat", "amount": "1", "unit": "pcs" },
  { "name": "Œufs", "amount": "2", "unit": "pcs" }
]`;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function MealUploadForm() {
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
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      if (file) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
    },
    [previewUrl],
  );

  async function runAiAnalysis() {
    if (!selectedFile) {
      toast.error("Choisis d’abord une photo.");
      return;
    }

    setAiPending(true);
    const toastId = toast.loading("L’IA analyse votre assiette…");
    try {
      const dataUrl = await readFileAsDataUrl(selectedFile);
      const res = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      const body: unknown = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          body &&
          typeof body === "object" &&
          "error" in body &&
          typeof (body as { error: unknown }).error === "string"
            ? (body as { error: string }).error
            : "Analyse impossible.";
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

      toast.success("Champs remplis à partir de la photo.", { id: toastId });
    } catch {
      toast.error("Erreur réseau pendant l’analyse.", { id: toastId });
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
    if (selectedFile) {
      fd.append("image", selectedFile);
    }
    fd.append("is_public", isPublic ? "true" : "false");

    const toastId = toast.loading("Enregistrement du repas et envoi de l’image…");

    setPending(true);
    try {
      const result = await createMeal(fd);
      if (!result.success) {
        toast.error(result.error, { id: toastId });
        return;
      }
      toast.success("Repas enregistré et ajouté au journal du jour.", {
        id: toastId,
      });
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Une erreur réseau est survenue.", { id: toastId });
    } finally {
      setPending(false);
    }
  }

  const disableForm = pending || aiPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enregistrer un repas</CardTitle>
        <CardDescription>
          Ajoute une photo, utilise l’optionnellement avec l’IA pour préremplir les
          champs, puis ajuste et enregistre.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} className="contents">
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="meal-title">Titre</Label>
            <Input
              id="meal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              placeholder="Ex. Bowl riz + poulet"
              disabled={disableForm}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meal-description">Description</Label>
            <Textarea
              id="meal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Notes rapides, contexte…"
              disabled={disableForm}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meal-instructions">Préparation (optionnel)</Label>
            <Textarea
              id="meal-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              placeholder="Étapes de la recette…"
              disabled={disableForm}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meal-ingredients">Ingrédients (JSON)</Label>
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
              Tableau d’objets avec au minimum <code className="rounded bg-muted px-1">name</code> ;{" "}
              <code className="rounded bg-muted px-1">amount</code> et{" "}
              <code className="rounded bg-muted px-1">unit</code> sont optionnels. Laisser vide
              pour aucun ingrédient.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v ?? "lunch")}
                disabled={disableForm}
              >
                <SelectTrigger className="w-full min-w-0" size="default">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Petit-déjeuner</SelectItem>
                  <SelectItem value="lunch">Déjeuner</SelectItem>
                  <SelectItem value="dinner">Dîner</SelectItem>
                  <SelectItem value="snack">Collation</SelectItem>
                  <SelectItem value="dessert">Dessert</SelectItem>
                  <SelectItem value="drink">Boisson</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Difficulté</Label>
              <Select
                value={difficulty}
                onValueChange={(v) => setDifficulty(v ?? "easy")}
                disabled={disableForm}
              >
                <SelectTrigger className="w-full min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Facile</SelectItem>
                  <SelectItem value="medium">Moyen</SelectItem>
                  <SelectItem value="hard">Difficile</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meal-image">Photo (optionnel)</Label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                id="meal-image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={disableForm}
                onChange={onImageChange}
                className="cursor-pointer sm:max-w-xs"
              />
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Aperçu du repas"
                  className="h-24 w-24 rounded-lg border object-cover"
                />
              ) : (
                <div className="flex size-24 shrink-0 items-center justify-center rounded-lg border border-dashed bg-muted/40 text-muted-foreground">
                  <Camera className="size-8" aria-hidden />
                </div>
              )}
            </div>
            {selectedFile ? (
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto"
                disabled={disableForm}
                onClick={runAiAnalysis}
              >
                {aiPending ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" aria-hidden />
                    L’IA analyse votre assiette…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" aria-hidden />
                    Analyser avec l’IA
                  </>
                )}
              </Button>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <Label htmlFor="meal-public">Publier publiquement</Label>
              <p className="text-xs text-muted-foreground">
                Si activé, le repas apparaîtra dans « Découvrir des repas » pour les autres
                utilisateurs.
              </p>
            </div>
            <Switch
              id="meal-public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
              disabled={disableForm}
              aria-label="Publier ce repas sur le fil d’exploration"
            />
          </div>

          <fieldset className="space-y-3 rounded-lg border border-border p-4">
            <legend className="px-1 text-sm font-medium">
              Macros (par portion, manuel ou prérempli par l’IA)
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="calories_per_serving">Calories (kcal)</Label>
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="protein_g_per_serving">Protéines (g)</Label>
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carbs_g_per_serving">Glucides (g)</Label>
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fat_g_per_serving">Lipides (g)</Label>
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
                />
              </div>
            </div>
          </fieldset>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 border-t bg-muted/30">
          <Button type="submit" disabled={disableForm}>
            {pending ? (
              <>
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
                Enregistrement…
              </>
            ) : (
              "Enregistrer le repas"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={disableForm}
            onClick={() => router.push("/dashboard")}
          >
            Annuler
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
