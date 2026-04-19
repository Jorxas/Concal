-- Concal : RLS pour likes / favoris / objectifs (à exécuter après le script meals si ces tables existent).

alter table public.recipe_likes enable row level security;

drop policy if exists "recipe_likes_select_own" on public.recipe_likes;
create policy "recipe_likes_select_own"
  on public.recipe_likes
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "recipe_likes_insert_own" on public.recipe_likes;
create policy "recipe_likes_insert_own"
  on public.recipe_likes
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "recipe_likes_delete_own" on public.recipe_likes;
create policy "recipe_likes_delete_own"
  on public.recipe_likes
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

alter table public.recipe_saves enable row level security;

drop policy if exists "recipe_saves_select_own" on public.recipe_saves;
create policy "recipe_saves_select_own"
  on public.recipe_saves
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "recipe_saves_insert_own" on public.recipe_saves;
create policy "recipe_saves_insert_own"
  on public.recipe_saves
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "recipe_saves_delete_own" on public.recipe_saves;
create policy "recipe_saves_delete_own"
  on public.recipe_saves
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

alter table public.user_goals enable row level security;

drop policy if exists "user_goals_select_own" on public.user_goals;
create policy "user_goals_select_own"
  on public.user_goals
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "user_goals_insert_own" on public.user_goals;
create policy "user_goals_insert_own"
  on public.user_goals
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "user_goals_update_own" on public.user_goals;
create policy "user_goals_update_own"
  on public.user_goals
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "user_goals_delete_own" on public.user_goals;
create policy "user_goals_delete_own"
  on public.user_goals
  for delete
  to authenticated
  using (user_id = (select auth.uid()));
