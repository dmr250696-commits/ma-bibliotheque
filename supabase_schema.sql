-- ============================================================
-- À exécuter dans Supabase : Project > SQL Editor > New query
-- ============================================================

create table if not exists public.livres (
  id uuid primary key default gen_random_uuid(),
  cle_acces text not null,
  titre text not null,
  auteur text,
  isbn text,
  couverture text,
  editeur text,
  annee text,
  genre text,
  prix numeric,
  nb_pages integer,
  note numeric check (note >= 0 and note <= 5),
  date_lecture date,
  categories_api text,
  statut text not null default 'non_lu',
  prete_a text,
  notes text,
  cree_le timestamptz not null default now()
);

-- Index pour accélérer les recherches par clé d'accès
create index if not exists idx_livres_cle_acces on public.livres (cle_acces);
create index if not exists idx_livres_genre on public.livres (genre);
create index if not exists idx_livres_note on public.livres (note);
create index if not exists idx_livres_date_lecture on public.livres (date_lecture);

-- Active la sécurité au niveau des lignes (Row Level Security)
alter table public.livres enable row level security;

-- Comme on utilise une clé d'accès "maison" plutôt que le système
-- d'authentification Supabase, on autorise les opérations via la clé
-- anonyme publique, et c'est le filtre `cle_acces` côté application
-- qui isole les données de chaque utilisateur.
--
-- ⚠️ Important : cette clé n'est PAS un mot de passe au sens cryptographique.
-- Elle isole tes données dans l'usage normal de l'appli, mais n'importe qui
-- connaissant ta clé (ou explorant l'API Supabase directement) pourrait y
-- accéder. Pour un usage personnel/privé entre toi et tes proches, c'est
-- largement suffisant. Évite juste de partager ta clé publiquement.

create policy "Acces par cle" on public.livres
  for all
  using (true)
  with check (true);
