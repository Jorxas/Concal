-- Concal : buckets + RLS sur storage.objects (sans ça, l’upload image = « new row violates row-level security »).
-- Exécuter dans Supabase → SQL Editor après les migrations tables meals.

insert into storage.buckets (id, name, public)
values ('meal-media', 'meal-media', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;

-- meal-media : écriture seulement sous {userId}/… ; lecture pour tout utilisateur connecté (fil « Découvrir » + URL signées).
drop policy if exists "storage_meal_media_insert_own" on storage.objects;
create policy "storage_meal_media_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'meal-media'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );

drop policy if exists "storage_meal_media_update_own" on storage.objects;
create policy "storage_meal_media_update_own"
  on storage.objects for update
  using (
    bucket_id = 'meal-media'
    and split_part(name, '/', 1) = (select auth.uid())::text
  )
  with check (
    bucket_id = 'meal-media'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );

drop policy if exists "storage_meal_media_delete_own" on storage.objects;
create policy "storage_meal_media_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'meal-media'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );

drop policy if exists "storage_meal_media_select_authenticated" on storage.objects;
create policy "storage_meal_media_select_authenticated"
  on storage.objects for select
  using (
    bucket_id = 'meal-media'
    and (select auth.uid()) is not null
  );

-- avatars : uniquement le dossier {userId}/…
drop policy if exists "storage_avatars_insert_own" on storage.objects;
create policy "storage_avatars_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );

drop policy if exists "storage_avatars_update_own" on storage.objects;
create policy "storage_avatars_update_own"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );

drop policy if exists "storage_avatars_delete_own" on storage.objects;
create policy "storage_avatars_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );

drop policy if exists "storage_avatars_select_own" on storage.objects;
create policy "storage_avatars_select_own"
  on storage.objects for select
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );
