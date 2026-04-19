-- Concal : politiques RLS pour enregistrer un repas (clé anon + JWT utilisateur).
-- Exécuter dans Supabase → SQL Editor (tout le fichier). Réexécute après mise à jour du dépôt.
-- Les politiques ne ciblent pas « TO authenticated » : l’accès repose sur auth.uid() (JWT).

-- ---------------------------------------------------------------------------
-- meals
-- ---------------------------------------------------------------------------
alter table public.meals enable row level security;

drop policy if exists "meals_select_visible" on public.meals;
create policy "meals_select_visible"
  on public.meals
  for select
  using (owner_id = (select auth.uid()) or coalesce(is_public, false) = true);

drop policy if exists "meals_insert_own" on public.meals;
create policy "meals_insert_own"
  on public.meals
  for insert
  with check (
    (select auth.uid()) is not null
    and owner_id = (select auth.uid())
  );

drop policy if exists "meals_update_own" on public.meals;
create policy "meals_update_own"
  on public.meals
  for update
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "meals_delete_own" on public.meals;
create policy "meals_delete_own"
  on public.meals
  for delete
  using (owner_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- meal_media (lignes liées à un repas dont tu es propriétaire, ou repas public)
-- ---------------------------------------------------------------------------
alter table public.meal_media enable row level security;

drop policy if exists "meal_media_select_visible" on public.meal_media;
create policy "meal_media_select_visible"
  on public.meal_media
  for select
  using (
    exists (
      select 1
      from public.meals m
      where m.id = meal_media.meal_id
        and (m.owner_id = (select auth.uid()) or coalesce(m.is_public, false) = true)
    )
  );

drop policy if exists "meal_media_insert_own_meal" on public.meal_media;
create policy "meal_media_insert_own_meal"
  on public.meal_media
  for insert
  with check (
    (select auth.uid()) is not null
    and exists (
      select 1
      from public.meals m
      where m.id = meal_media.meal_id
        and m.owner_id = (select auth.uid())
    )
  );

drop policy if exists "meal_media_delete_own_meal" on public.meal_media;
create policy "meal_media_delete_own_meal"
  on public.meal_media
  for delete
  using (
    exists (
      select 1
      from public.meals m
      where m.id = meal_media.meal_id
        and m.owner_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- meal_logs
-- ---------------------------------------------------------------------------
alter table public.meal_logs enable row level security;

drop policy if exists "meal_logs_select_own" on public.meal_logs;
create policy "meal_logs_select_own"
  on public.meal_logs
  for select
  using (user_id = (select auth.uid()));

drop policy if exists "meal_logs_insert_own" on public.meal_logs;
create policy "meal_logs_insert_own"
  on public.meal_logs
  for insert
  with check (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
  );

drop policy if exists "meal_logs_update_own" on public.meal_logs;
create policy "meal_logs_update_own"
  on public.meal_logs
  for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "meal_logs_delete_own" on public.meal_logs;
create policy "meal_logs_delete_own"
  on public.meal_logs
  for delete
  using (user_id = (select auth.uid()));
