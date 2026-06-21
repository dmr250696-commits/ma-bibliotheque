-- ============================================================
-- MIGRATION : à exécuter dans Supabase > SQL Editor > New query
-- (à exécuter UNE FOIS, en plus de supabase_schema.sql déjà passé)
-- ============================================================

alter table public.livres
  add column if not exists genre text,
  add column if not exists prix numeric,
  add column if not exists nb_pages integer,
  add column if not exists note numeric check (note >= 0 and note <= 5),
  add column if not exists date_lecture date,
  add column if not exists categories_api text;

-- Index pour accélérer les filtres et tris fréquents
create index if not exists idx_livres_genre on public.livres (genre);
create index if not exists idx_livres_note on public.livres (note);
create index if not exists idx_livres_date_lecture on public.livres (date_lecture);
