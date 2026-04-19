-- Concal : lien optionnel vers une vidéo de préparation (YouTube, etc.).

alter table public.meals
  add column if not exists cooking_video_url text;

comment on column public.meals.cooking_video_url is 'URL HTTPS vers une vidéo externe montrant la préparation (optionnel).';
