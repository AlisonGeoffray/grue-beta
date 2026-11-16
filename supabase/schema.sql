-- =====================================================================
-- GRUE.EXE · sondage anonyme du channel Tech News Smart Control
-- Schéma Supabase · version 3.0
--
-- À faire une fois · Supabase > SQL Editor > New query > coller > Run.
-- Avant de lancer, vérifie la date de fermeture (cherche ⚠️ plus bas).
--
-- Tu peux relancer ce script sans rien effacer. C'est comme ça qu'on
-- change la date de fermeture.
--
-- Ce que la clé publishable du site (rôle anon) peut faire · AJOUTER une
-- réponse, jusqu'à la date de fermeture. Rien d'autre · ni lire, ni
-- modifier, ni supprimer.
-- =====================================================================


-- 0. Garde-fou · une table de la v1 ou de la v2 ne convient pas à la v3 --
-- Si une version précédente a tourné dans ce projet, garde ses totaux
-- (son bilan.sql), supprime la table (voir la fin de ce script), puis
-- relance ce script.
do $$
begin
  if to_regclass('public.reponses') is not null
     and not exists (select 1 from information_schema.columns
                     where table_schema = 'public' and table_name = 'reponses'
                       and column_name = 'pseudo') then
    raise exception 'La table public.reponses d''une version précédente existe déjà. Garde ses totaux, supprime-la, puis relance ce script.';
  end if;
end
$$;


-- 1. Contrôle des cases à cocher ----------------------------------------
-- Rangé dans un schéma « prive », que l'API de Supabase n'expose pas.
-- Vérifie · valeurs connues, pas de doublon, pas plus de « maxi » choix
-- (en v3, « maxi » = nombre d'options · plus de limite de 2 choix).
create schema if not exists prive;

create or replace function prive.liste_ok(valeurs text[], permises text[], maxi integer)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select valeurs is not null
     and cardinality(valeurs) <= maxi
     and (cardinality(valeurs) = 0 or array_ndims(valeurs) = 1)
     and valeurs <@ permises
     and cardinality(valeurs) = (select count(distinct v) from unnest(valeurs) as v)
$$;


-- 2. La table des réponses ------------------------------------------------
-- Pas de nom, pas d'e-mail, pas d'heure. Les identifiants sont ceux de
-- app.js · si tu en changes un là-bas, change-le ici aussi.
-- « c_m365 » garde son identifiant de la v1 (carte passée dans le paquet 2).
create table if not exists public.reponses (
  id            uuid primary key default gen_random_uuid(),
  jour          date not null default current_date,
  version       text not null check (version ~ '^[0-9]{1,2}[.][0-9]{1,2}$'),
  statut        text not null check (statut in ('complet', 'sortie')),

  -- Pseudo tiré au hasard sur le poste · Nom-Adjectif-0000. Pas d'unicité ·
  -- deux personnes peuvent tirer le même.
  pseudo        text,

  -- Étape 1 · paquet 1, IA et développement
  c_bases       text check (c_bases     in ('non', 'maitrise', 'interesse')),
  c_copilot     text check (c_copilot   in ('non', 'maitrise', 'interesse')),
  c_agents      text check (c_agents    in ('non', 'maitrise', 'interesse')),
  c_mcp         text check (c_mcp       in ('non', 'maitrise', 'interesse')),
  c_tests       text check (c_tests     in ('non', 'maitrise', 'interesse')),
  c_revue       text check (c_revue     in ('non', 'maitrise', 'interesse')),
  c_existant    text check (c_existant  in ('non', 'maitrise', 'interesse')),
  c_auto        text check (c_auto      in ('non', 'maitrise', 'interesse')),
  c_vibe        text check (c_vibe      in ('non', 'maitrise', 'interesse')),
  c_local       text check (c_local     in ('non', 'maitrise', 'interesse')),
  -- Étape 2 · paquet 2, IA au-delà du code
  i_exigences   text check (i_exigences in ('non', 'maitrise', 'interesse')),
  i_ihm         text check (i_ihm       in ('non', 'maitrise', 'interesse')),
  i_grue        text check (i_grue      in ('non', 'maitrise', 'interesse')),
  i_ecologie    text check (i_ecologie  in ('non', 'maitrise', 'interesse')),
  c_m365        text check (c_m365      in ('non', 'maitrise', 'interesse')),
  -- « Un sujet manque ? » après chaque paquet
  sujet_dev     text,
  sujet_inge    text,

  -- Étape 3 · tech hors IA, et « Quels sujets ? » si oui
  tech_hors_ia  text check (tech_hors_ia in ('oui', 'non')),
  tech_sujets   text,

  -- Étapes 4 à 6
  formats       text[] not null default '{}',
  un_a_un       text check (un_a_un in ('oui', 'plus_tard', 'non')),
  role          text check (role in ('lit', 'reagit', 'partage', 'demo', 'referent')),
  idee          text,
  duree_s       integer,

  -- Sortie (« Pas pour moi »)
  raison_sortie text check (raison_sortie in ('temps', 'pas_ia', 'canaux', 'acces')),

  -- Nom de la liste, majuscule · adjectif, majuscule · 4 chiffres.
  constraint pseudo_ok check (
    char_length(pseudo) <= 40 and pseudo ~ '^[A-ZÀ-Ý][a-zà-ÿ]+-[A-Z][a-z]+-[0-9]{4}$'),
  -- Plusieurs choix possibles, sans limite.
  constraint formats_ok check (
    prive.liste_ok(formats, '{posts,tutos,demos,defis,outils}', 5)),

  -- Champs libres · une seule ligne, longueur max, pas d'adresse e-mail.
  constraint sujet_dev_ok check (
    char_length(sujet_dev) between 1 and 120 and sujet_dev !~ '[[:cntrl:]]'
    and sujet_dev !~* '[^[:space:]@]+@[^[:space:]@]+[.][a-z]{2,}'),
  constraint sujet_inge_ok check (
    char_length(sujet_inge) between 1 and 120 and sujet_inge !~ '[[:cntrl:]]'
    and sujet_inge !~* '[^[:space:]@]+@[^[:space:]@]+[.][a-z]{2,}'),
  -- « Quels sujets ? » · seulement après « Oui ».
  constraint tech_sujets_ok check (
    tech_sujets is null
    or (char_length(tech_sujets) between 1 and 120 and tech_sujets !~ '[[:cntrl:]]'
        and tech_sujets !~* '[^[:space:]@]+@[^[:space:]@]+[.][a-z]{2,}'
        and tech_hors_ia = 'oui')),
  constraint idee_ok check (
    char_length(idee) between 1 and 280 and idee !~ '[[:cntrl:]]'
    and idee !~* '[^[:space:]@]+@[^[:space:]@]+[.][a-z]{2,}'),

  -- Durée de remplissage arrondie à 10 s, 1 h max.
  constraint duree_ok check (duree_s between 0 and 3600 and duree_s % 10 = 0),

  -- Une réponse complète a son pseudo et toutes les réponses obligatoires,
  -- les 15 cartes comprises. Une sortie (« Pas pour moi ») n'a que sa raison,
  -- facultative, et pas de pseudo.
  constraint coherence_ok check (
    (statut = 'complet'
      and pseudo is not null and tech_hors_ia is not null and un_a_un is not null and role is not null
      and cardinality(formats) >= 1
      and num_nonnulls(c_bases, c_copilot, c_agents, c_mcp, c_tests, c_revue, c_existant, c_auto, c_vibe, c_local,
                       i_exigences, i_ihm, i_grue, i_ecologie, c_m365) = 15
      and raison_sortie is null)
    or
    (statut = 'sortie'
      and pseudo is null and tech_hors_ia is null and tech_sujets is null
      and un_a_un is null and role is null
      and sujet_dev is null and sujet_inge is null and idee is null and duree_s is null
      and cardinality(formats) = 0
      and num_nonnulls(c_bases, c_copilot, c_agents, c_mcp, c_tests, c_revue, c_existant, c_auto, c_vibe, c_local,
                       i_exigences, i_ihm, i_grue, i_ecologie, c_m365) = 0))
);

comment on table public.reponses is
  'GRUE.EXE v3 · une ligne par réponse anonyme, avec un pseudo tiré au hasard. Ni nom, ni e-mail, ni heure.';


-- 3. Qui a le droit de faire quoi -----------------------------------------
-- RLS activée · sans règle explicite, personne ne passe.
alter table public.reponses enable row level security;

-- Supabase donne par défaut tous les droits aux rôles anon et
-- authenticated · on les retire, puis on n'autorise que l'ajout.
-- « id » et « jour » sont remplis par la base, jamais par le site.
-- Aucun droit de lecture pour anon · les réponses se lisent dans Supabase.
revoke all on table public.reponses from anon, authenticated;
grant usage on schema public to anon;
grant insert (version, statut, pseudo,
              c_bases, c_copilot, c_agents, c_mcp, c_tests, c_revue, c_existant, c_auto, c_vibe, c_local,
              i_exigences, i_ihm, i_grue, i_ecologie, c_m365,
              sujet_dev, sujet_inge, tech_hors_ia, tech_sujets,
              formats, un_a_un, role, idee, duree_s, raison_sortie)
  on table public.reponses to anon;
grant execute on function prive.liste_ok(text[], text[], integer) to anon;


-- 4. Date de fermeture ------------------------------------------------------
-- Après cette date, la base refuse toute nouvelle réponse.
drop policy if exists depot_anonyme on public.reponses;
create policy depot_anonyme on public.reponses
  for insert
  to anon
  with check (current_date <= date '2026-12-31');  -- ⚠️ DATE DE FERMETURE (AAAA-MM-JJ), la même que « fermeture » dans config.js


-- 5. Vérification -------------------------------------------------------------
-- Doit afficher la seule règle « depot_anonyme », avec ta date de fermeture.
select policyname as regle, cmd as action, roles, with_check as condition
from pg_policies
where schemaname = 'public' and tablename = 'reponses';


-- =====================================================================
-- APRÈS LA RESTITUTION (+ 3 mois) · supprimer les réponses brutes.
-- Garde d'abord les totaux (bilan.sql), puis enlève les deux tirets
-- devant ces deux lignes et lance-les.
-- drop table public.reponses;
-- drop schema prive cascade;
-- =====================================================================
