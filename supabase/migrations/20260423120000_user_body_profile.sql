-- Profil anthropométrique pour estimer besoins caloriques / macros (une ligne par utilisateur).

create table if not exists public.user_body_profile (
  user_id uuid not null primary key references auth.users (id) on delete cascade,
  sex text not null check (sex in ('male', 'female', 'other')),
  age_years int not null check (age_years between 14 and 100),
  height_cm int not null check (height_cm between 100 and 250),
  weight_kg numeric not null check (weight_kg >= 30 and weight_kg <= 400),
  activity_sessions_per_week int not null
    check (activity_sessions_per_week between 0 and 21),
  goal_type text not null
    check (goal_type in ('lose_weight', 'maintain', 'gain_mass')),
  updated_at timestamptz not null default now()
);

comment on table public.user_body_profile is 'Données pour calculer les objectifs nutritionnels (TDEE, macros).';

alter table public.user_body_profile enable row level security;

drop policy if exists "user_body_profile_select_own" on public.user_body_profile;
create policy "user_body_profile_select_own"
  on public.user_body_profile
  for select
  using (user_id = (select auth.uid()));

drop policy if exists "user_body_profile_insert_own" on public.user_body_profile;
create policy "user_body_profile_insert_own"
  on public.user_body_profile
  for insert
  with check (
    (select auth.uid()) is not null
    and user_id = (select auth.uid())
  );

drop policy if exists "user_body_profile_update_own" on public.user_body_profile;
create policy "user_body_profile_update_own"
  on public.user_body_profile
  for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "user_body_profile_delete_own" on public.user_body_profile;
create policy "user_body_profile_delete_own"
  on public.user_body_profile
  for delete
  using (user_id = (select auth.uid()));
