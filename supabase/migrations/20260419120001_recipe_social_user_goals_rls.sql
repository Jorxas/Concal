-- Concal : RLS pour likes / favoris / objectifs (après le script meals). Réexécute si tu mises à jour le dépôt.

alter table public.recipe_likes enable row level security;

drop policy if exists "recipe_likes_select_own" on public.recipe_likes;
create policy "recipe_likes_select_own"
  on public.recipe_likes
  for select
  using (user_id = (select auth.uid()));

drop policy if exists "recipe_likes_insert_own" on public.recipe_likes;
create policy "recipe_likes_insert_own"
  on public.recipe_likes
  for insert
  with check (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
  );

drop policy if exists "recipe_likes_delete_own" on public.recipe_likes;
create policy "recipe_likes_delete_own"
  on public.recipe_likes
  for delete
  using (user_id = (select auth.uid()));

alter table public.recipe_saves enable row level security;

drop policy if exists "recipe_saves_select_own" on public.recipe_saves;
create policy "recipe_saves_select_own"
  on public.recipe_saves
  for select
  using (user_id = (select auth.uid()));

drop policy if exists "recipe_saves_insert_own" on public.recipe_saves;
create policy "recipe_saves_insert_own"
  on public.recipe_saves
  for insert
  with check (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
  );

drop policy if exists "recipe_saves_delete_own" on public.recipe_saves;
create policy "recipe_saves_delete_own"
  on public.recipe_saves
  for delete
  using (user_id = (select auth.uid()));

alter table public.user_goals enable row level security;

drop policy if exists "user_goals_select_own" on public.user_goals;
create policy "user_goals_select_own"
  on public.user_goals
  for select
  using (user_id = (select auth.uid()));

drop policy if exists "user_goals_insert_own" on public.user_goals;
create policy "user_goals_insert_own"
  on public.user_goals
  for insert
  with check (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
  );

drop policy if exists "user_goals_update_own" on public.user_goals;
create policy "user_goals_update_own"
  on public.user_goals
  for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "user_goals_delete_own" on public.user_goals;
create policy "user_goals_delete_own"
  on public.user_goals
  for delete
  using (user_id = (select auth.uid()));
