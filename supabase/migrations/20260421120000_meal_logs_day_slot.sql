-- Concal : créneaux journaliers (petit-déj., déjeuner, collation, dîner) pour meal_logs.
-- Exécuter dans Supabase → SQL Editor. Après ça, la conso du jour ne compte que les lignes avec day_slot renseigné.

alter table public.meal_logs
  add column if not exists day_slot text;

alter table public.meal_logs
  drop constraint if exists meal_logs_day_slot_check;

alter table public.meal_logs
  add constraint meal_logs_day_slot_check
  check (
    day_slot is null
    or day_slot in ('breakfast', 'lunch', 'snack', 'dinner')
  );

create unique index if not exists meal_logs_user_logged_day_slot_key
  on public.meal_logs (user_id, logged_on, day_slot)
  where day_slot is not null;
