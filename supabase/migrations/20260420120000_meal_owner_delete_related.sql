-- Permet au propriétaire d’un repas de supprimer likes / favoris / logs liés (nécessaire avant DELETE sur meals).

drop policy if exists "recipe_likes_delete_if_meal_owner" on public.recipe_likes;
create policy "recipe_likes_delete_if_meal_owner"
  on public.recipe_likes for delete
  using (
    exists (
      select 1 from public.meals m
      where m.id = recipe_likes.meal_id
        and m.owner_id = (select auth.uid())
    )
  );

drop policy if exists "recipe_saves_delete_if_meal_owner" on public.recipe_saves;
create policy "recipe_saves_delete_if_meal_owner"
  on public.recipe_saves for delete
  using (
    exists (
      select 1 from public.meals m
      where m.id = recipe_saves.meal_id
        and m.owner_id = (select auth.uid())
    )
  );

drop policy if exists "meal_logs_delete_if_meal_owner" on public.meal_logs;
create policy "meal_logs_delete_if_meal_owner"
  on public.meal_logs for delete
  using (
    exists (
      select 1 from public.meals m
      where m.id = meal_logs.meal_id
        and m.owner_id = (select auth.uid())
    )
  );
