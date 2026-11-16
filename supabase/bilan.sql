-- =====================================================================
-- GRUE.EXE · bilan des réponses v3, pour préparer la restitution
-- Supabase > SQL Editor > coller UNE requête > Run.
-- Ces requêtes ne font que lire. Elles ne modifient rien.
--
-- Totaux seulement · jamais de pseudo, jamais de ligne individuelle.
-- Les champs libres (sujets, idées) ne sont pas recopiés ici, seulement
-- comptés. Les relire dans Supabase avant de citer quoi que ce soit.
--
-- Rappels anonymat (équipe de 10 à 20 personnes)
-- - À la restitution, on montre des totaux, jamais une ligne seule.
-- - Pas de croisement (ex. tech hors IA × rôle) si une case compte moins de 3 personnes.
-- - Un sujet ou une idée n'est cité que s'il ne permet pas de reconnaître quelqu'un.
-- =====================================================================


-- 1. Participation ----------------------------------------------------------
-- Une même personne peut avoir une ligne « sortie » puis une « complet »
-- (elle a d'abord cliqué « Pas pour moi », puis changé d'avis).
-- Les résultats 2 à 8 et 10 ne comptent que les réponses complètes.
select version, statut, count(*) as reponses
from public.reponses
group by version, statut
order by version, statut;


-- 2. Étapes 1 et 2 · cartes, paquet par paquet -------------------------------
-- Tri · « Ça m'intéresse » d'abord. « Je maîtrise » = futur·es référent·es ou démos.
-- « c_m365 » garde son identifiant v1 mais se trouve dans le paquet 2.
select c.paquet, c.carte,
       count(*) filter (where c.choix = 'interesse') as ca_m_interesse,
       count(*) filter (where c.choix = 'maitrise')  as je_maitrise,
       count(*) filter (where c.choix = 'non')       as pas_pour_moi
from public.reponses r
cross join lateral (values
  ('1 · IA et développement',  'Les bases',                                 r.c_bases),
  ('1 · IA et développement',  'Configurer GitHub Copilot',                 r.c_copilot),
  ('1 · IA et développement',  'Agents et skills',                          r.c_agents),
  ('1 · IA et développement',  'MCP et connecteurs',                        r.c_mcp),
  ('1 · IA et développement',  'Génération de tests',                       r.c_tests),
  ('1 · IA et développement',  'Revue de code assistée',                    r.c_revue),
  ('1 · IA et développement',  'Comprendre et documenter du code existant', r.c_existant),
  ('1 · IA et développement',  'Automatisation',                            r.c_auto),
  ('1 · IA et développement',  'Vibe coding',                               r.c_vibe),
  ('1 · IA et développement',  'IA en local',                               r.c_local),
  ('2 · IA au-delà du code',   'Exigences et specs',                        r.i_exigences),
  ('2 · IA au-delà du code',   'IHM et design',                             r.i_ihm),
  ('2 · IA au-delà du code',   'IA sur la grue',                            r.i_grue),
  ('2 · IA au-delà du code',   'IA et écologie',                            r.i_ecologie),
  ('2 · IA au-delà du code',   'M365 Copilot au quotidien',                 r.c_m365)
) as c(paquet, carte, choix)
where r.statut = 'complet'
group by c.paquet, c.carte
order by c.paquet, ca_m_interesse desc, je_maitrise desc, c.carte;


-- 3. Champs libres · combien en ont rempli un --------------------------------
select count(sujet_dev)   as sujets_paquet_1,
       count(sujet_inge)  as sujets_paquet_2,
       count(tech_sujets) as sujets_tech_hors_ia,
       count(idee)        as idees
from public.reponses
where statut = 'complet';


-- 4. Étape 3 · tech hors IA dans le channel ------------------------------------
select case tech_hors_ia
         when 'oui' then 'Oui'
         when 'non' then 'Non'
       end as tech_hors_ia,
       count(*) as personnes
from public.reponses
where statut = 'complet'
group by tech_hors_ia
order by min(array_position(array['oui', 'non'], tech_hors_ia));


-- 5. Étape 4 · formats (plusieurs choix possibles) -----------------------------
select case f
         when 'posts'  then 'Posts courts'
         when 'tutos'  then 'Tutos pas à pas'
         when 'demos'  then 'Démos'
         when 'defis'  then 'Défis'
         when 'outils' then 'Outils prêts à l''emploi'
       end as format,
       count(*) as personnes
from public.reponses, unnest(formats) as f
where statut = 'complet'
group by f
order by personnes desc, format;


-- 6. Étape 5 · envie d'un 1:1 -------------------------------------------------
select case un_a_un
         when 'oui'       then 'Oui'
         when 'plus_tard' then 'Peut-être plus tard'
         when 'non'       then 'Non merci'
       end as un_a_un,
       count(*) as personnes
from public.reponses
where statut = 'complet'
group by un_a_un
order by min(array_position(array['oui', 'plus_tard', 'non'], un_a_un));


-- 7. Étape 5 · participation au channel ---------------------------------------
select case role
         when 'lit'      then 'Je lis'
         when 'reagit'   then 'Je réagis et je pose des questions'
         when 'partage'  then 'Je partage mes outils et mes astuces'
         when 'demo'     then 'Je veux bien faire une démo'
         when 'referent' then 'Je veux bien être référent·e d''un sujet'
       end as role,
       count(*) as personnes
from public.reponses
where statut = 'complet'
group by role
order by min(array_position(array['lit', 'reagit', 'partage', 'demo', 'referent'], role));


-- 8. Durée de remplissage --------------------------------------------------------
select count(duree_s) as reponses_chronometrees,
       percentile_disc(0.5) within group (order by duree_s) as mediane_s,
       max(duree_s) as plus_long_s
from public.reponses
where statut = 'complet';


-- 9. Raisons de sortie (« Pas pour moi ») ------------------------------------
select coalesce(case raison_sortie
         when 'temps'  then 'Pas le temps en ce moment'
         when 'pas_ia' then 'L''IA, ça ne me parle pas'
         when 'canaux' then 'Déjà trop de canaux'
         when 'acces'  then 'Pas d''accès ou pas autorisé'
       end, '(pas de raison donnée)') as raison,
       count(*) as personnes
from public.reponses
where statut = 'sortie'
group by raison_sortie
order by personnes desc, raison;


-- 10. Réponses par jour (utile pour une relance) --------------------------------
select jour, count(*) as reponses
from public.reponses
where statut = 'complet'
group by jour
order by jour;
