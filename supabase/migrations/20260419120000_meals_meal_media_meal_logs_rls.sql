-- Concal : politiques RLS pour enregistrer un repas (client authentifié, clé anon).
-- À exécuter dans Supabase → SQL Editor une fois (ou via CLI `supabase db push`).

-- ---------------------------------------------------------------------------
-- meals
-- ---------------------------------------------------------------------------
alter table public.meals enable row level security;

drop policy if exists "meals_select_visible" on public.meals;
create policy "meals_select_visible"
  on public.meals
  for select
  to authenticated
  using (owner_id = (select auth.uid()) or coalesce(is_public, false) = true);

drop policy if exists "meals_insert_own" on public.meals;
create policy "meals_insert_own"
  on public.meals
  for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "meals_update_own" on public.meals;
create policy "meals_update_own"
  on public.meals
  for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "meals_delete_own" on public.meals;
create policy "meals_delete_own"
  on public.meals
  for delete
  to authenticated
  using (owner_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- meal_media (lignes liées à un repas dont tu es propriétaire, ou repas public)
-- ---------------------------------------------------------------------------
alter table public.meal_media enable row level security;

drop policy if exists "meal_media_select_visible" on public.meal_media;
create policy "meal_media_select_visible"
  on public.meal_media
  for select
  to authenticated
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
  to authenticated
  with check (
    exists (
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
  to authenticated
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
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "meal_logs_insert_own" on public.meal_logs;
create policy "meal_logs_insert_own"
  on public.meal_logs
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "meal_logs_update_own" on public.meal_logs;
create policy "meal_logs_update_own"
  on public.meal_logs
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "meal_logs_delete_own" on public.meal_logs;
create policy "meal_logs_delete_own"
  on public.meal_logs
  for delete
  to authenticated
  using (user_id = (select auth.uid()));
