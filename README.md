# GRUE.EXE v3 · mode d'emploi

Sondage anonyme du channel **Tech News Smart Control** (équipe Smart Control). 6 étapes, 15 cartes, une fenêtre Windows 95 sur fond noir.

Pas de framework, pas de build, aucune dépendance. Aucune requête vers un site tiers · la police est hébergée avec le site. Le dossier `app-v3/` se pose tel quel sur un hébergement statique.

| Fichier | Rôle | À modifier ? |
|---|---|---|
| `index.html` | la page | non |
| `style.css` | le look Windows 95 noir et vert, UI kit de la planche v3. Contient aussi le jeu latin de VT323 en base64 (une ligne très longue, en tête de fichier) | rarement |
| `app.js` | questions, cartes, pseudo, jauge, envoi | pour changer un texte |
| `config.js` | les 5 réglages, dont `edition` (site bêta ou vraie version) | **oui** |
| `fonts/` | VT323 pour les titres · `vt323-latin.woff2` (l'original de la copie base64 de `style.css`), `vt323-latin-ext.woff2` (latin étendu, chargé seulement si un texte en a besoin) et la licence `OFL.txt` | non |
| `grue-en-construction.gif`, `grue-en-construction-fixe.png` | GIF de l'accueil, lu une fois, et sa dernière image, affichée à la place si les animations sont réduites. Générés par `gif/fabrique_gif.py` (dessin maison) | non |
| `supabase/schema.sql` | table, droits, date de fermeture | la date |
| `supabase/bilan.sql` | 10 requêtes de totaux pour la restitution | non |

La mise en ligne suit `app-v2/README.md` (§ 1 à 10). Ce fichier ne garde que ce qui change.

---

## Les 6 étapes

| Étape | Écran | Colonnes |
|---|---|---|
| 1/6 | Paquet 1/2 · IA et développement · 10 cartes, puis « Un sujet manque ? » | `c_bases` … `c_local`, `sujet_dev` |
| 2/6 | Paquet 2/2 · IA au-delà du code · 5 cartes, puis « Un sujet manque ? » | `i_exigences`, `i_ihm`, `i_grue`, `i_ecologie`, `c_m365`, `sujet_inge` |
| 3/6 | Dans le channel, tu veux aussi de la tech hors IA ? | `tech_hors_ia`, `tech_sujets` |
| 4/6 | Quels formats t'intéressent ? | `formats` |
| 5/6 | Un 1:1 de 30 min, ça te dirait ? · Comment tu veux participer ? | `un_a_un`, `role` |
| 6/6 | Une idée pour le channel ? | `idee` |

- Chaque carte se trie · ← Pas pour moi (`non`), ↑ Je maîtrise (`maitrise`), → Ça m'intéresse (`interesse`). À la souris, au doigt (swipe), aux flèches ou avec les 3 boutons.
- L'accueil annonce « 1 à 2 minutes, 6 étapes. ». Durée à chronométrer sur l'app v3 avant l'envoi (textes-v3, point 2).
- Les textes viennent de `textes-v3.md`, puis de `textes-v2.md` pour le reste.

## Pseudo

- Tiré au hasard dans le navigateur à chaque ouverture de la page (`crypto.getRandomValues`) · un nom et un adjectif parmi les 12 de textes-v3, puis 4 chiffres. Par exemple Treuil-Zen-4821.
- Bouton « Autre pseudo » sur l'accueil pour en tirer un autre.
- Envoyé seulement avec une réponse complète (colonne `pseudo`). « Pas pour moi » n'envoie pas de pseudo.
- La base vérifie le format, pas l'unicité · deux personnes peuvent tirer le même.
- Jamais gardé dans le navigateur, même en démo.

## Comment c'est anonyme ?

Le dépliant de l'accueil est retiré (textes-v3, 12/11). Son contenu vit ici, vérifié contre le code.

> On enregistre tes réponses, ton pseudo, la date sans l'heure et la durée arrondie à 10 secondes. Aucun cookie.

- Réponse complète · les champs de `payloadComplet()` dans `app.js` (cartes, sujets proposés, tech hors IA, formats, 1:1, rôle, idée), le pseudo, la durée, et la version de l'app avec le statut `complet`.
- « Pas pour moi » · seulement la raison, facultative, avec la version et le statut `sortie`. Ni pseudo ni durée.
- La base ajoute le jour (`jour`, type `date`, sans heure) et un identifiant tiré au hasard (`id`).
- Durée · arrondie à 10 s et plafonnée à 1 h, par l'app et par la base.
- Aucun cookie · l'app n'en pose pas et envoie sans cookie (`credentials: "omit"`). Les tests le vérifient.

> Les réponses sont stockées en Europe. Seule l'animatrice les voit une par une. L'équipe voit seulement les totaux.

- Europe · à condition de créer le projet Supabase dans **une région Europe** (étape 2 ci-dessous).
- Une par une · la clé publique ne peut qu'ajouter une ligne (RLS et droits de `schema.sql`, vérifiés par `tests-v3/pglite.test.mjs`). Lire demande l'accès au projet Supabase · ne le partage pas.
- Totaux · `bilan.sql` ne renvoie que des totaux, jamais un pseudo ni un texte libre. Partage ces résultats-là seulement. Les sujets proposés et les idées se lisent dans Supabase, sans les recopier pour l'équipe.

> Personne ne sait que ce pseudo est le tien, sauf si tu le donnes.

- Le pseudo est tiré dans le navigateur, sans compte, sans nom ni e-mail. Les adresses e-mail sont refusées dans les champs libres, par l'app et par la base.
- La table n'a ni adresse IP, ni navigateur, ni heure (vérifié par `tests-v3/pglite.test.mjs`).

**La note gardée par le navigateur** · `localStorage`, pas un cookie, jamais envoyée.

- `grue.v3.deja` · `{"statut":"complet"}` ou `{"statut":"sortie"}`, pour ne pas reposer les questions (écrans « Déjà répondu. » et « Rebonjour. »).
- `grue.v3.demo` · en mode démo seulement, les 50 dernières réponses de test, avec la date sans l'heure, sans pseudo.
- Site bêta (`edition: "beta"`) · les mêmes notes, à part · `grue.v3.beta.deja` et `grue.v3.beta.demo`. Le site bêta et le vrai site ont la même adresse de base, `https://<ton-pseudo>.github.io`, donc le même stockage dans le navigateur · une réponse bêta n'affiche jamais « Déjà répondu. » sur le vrai site, et inversement (vérifié par `tests-v3/beta.test.mjs`).
- Jamais le pseudo.

**Les journaux techniques des hébergeurs** · hors de l'app.

- GitHub Pages · GitHub enregistre l'adresse IP des visites d'un site Pages, pour la sécurité, avec ou sans compte GitHub. Source · [GitHub Docs, About GitHub Pages, Data collection](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages#data-collection).
- Supabase · garde des journaux techniques des requêtes (tableau de bord > Logs), dont l'adresse IP. Leur durée de conservation dépend de l'offre du projet. Source · [Supabase Docs, Logging](https://supabase.com/docs/guides/telemetry/logs).
- On ne les consulte pas. La table, elle, ne garde ni adresse IP ni heure.

## Mise en ligne · ce qui change par rapport à la v2

Suis les § 1 à 10 de `app-v2/README.md`, avec ces différences. Commence par la bêta · voir « Bêta, puis vraie version » juste après.

1. **Démo** · tant que `config.js` est vide. Plus de bandeau · la barre d'état affiche « v265.01 · démo ». Les réponses de test restent dans `grue.v3.demo` (50 au plus, sans pseudo). Avec une vraie configuration, `?demo` à la fin de l'adresse teste sans rien envoyer.
2. **Supabase** · un projet dans une région précise de l'UE, **West EU (Paris), `eu-west-3`**, puis `app-v3/supabase/schema.sql` (pas celui de la v2). Pas la région générale « Europe » · elle peut placer le projet à Londres ou Zurich, hors UE. Source · [Supabase Docs, Available regions](https://supabase.com/docs/guides/platform/regions). La table v3 n'est pas compatible avec celle de la v2. Si la table v2 est dans le même projet · lance d'abord le `bilan.sql` de la v2 et exporte ses totaux, puis supprime la table (bloc commenté en fin de `schema.sql`). Sinon le script s'arrête avec un message.
3. **config.js** · 5 réglages · les 4 de la v2 (`supabaseUrl`, `supabaseKey`, `fermeture`, `lienChannel`) et `edition`, vide pour la vraie version, `"beta"` pour le site de test. La date de fermeture n'est plus affichée. Elle ferme toujours le sondage, avec la même date dans `schema.sql` (`2026-12-31` par défaut).
4. **GitHub Pages** · glisse le contenu de `app-v3/`, plus celui d'`app-v2/`.
5. **Test réel** · « · démo » et « · bêta » doivent avoir disparu de la barre d'état. Dans `reponses` · une ligne `complet` avec un pseudo, une ligne `sortie` sans pseudo. Vide la table avant le mail.
6. **Mail d'annonce** · parler du « sondage Tech News Smart Control » (textes-v3, points ouverts).
7. **Résultats** · `bilan.sql` v3, 10 requêtes, totaux seulement. Restitution · voir « Comment c'est anonyme ? ».
8. **Modifier une question** · `textes-v3.md` prime. `VERSION` passe de `"3.0"` à `"3.1"` dès qu'une question change. Une carte = une colonne · son `id` se reporte à l'identique dans `schema.sql` (colonne, contrôle `coherence_ok`, `grant insert`) et dans `bilan.sql`.
9. **Dépannage** · même tableau. Première ligne · « · démo » encore affiché une fois en ligne → `config.js` vide, pas commité ou en cache. En plus · « · bêta » sur le vrai site → vide `edition` dans `config.js`. « edition doit valoir beta ou rester vide » → `edition` vaut autre chose que `"beta"`, `"bêta"` ou `""`.
10. **Plan B Microsoft Forms** · plus de limite de 2 choix (retirée en v3).

## Bêta, puis vraie version

Les réponses des testeurs ne se mélangent jamais à celles du vrai sondage · deux projets Supabase, deux sites. Même code, même `schema.sql`, même `bilan.sql`, mêmes données envoyées · seul `config.js` change.

| | Bêta | Vraie version |
|---|---|---|
| Projet Supabase, région Paris (`eu-west-3`) | `grue-beta` | `grue`, créé après la bêta |
| Dépôt GitHub Pages | `grue-beta` | `grue`, publié après les corrections |
| `config.js` | clés de `grue-beta`, `edition: "beta"` | clés de `grue`, `edition: ""` |
| Barre d'état | « v265.01 · bêta » | « v265.01 » |

1. **Projet `grue-beta`** · **New project** `grue-beta`, région West EU (Paris), puis **SQL Editor** > tout `supabase/schema.sql` > **Run** (§ 2 de `app-v2/README.md`). Note sa Project URL et sa Publishable key (bouton **Connect**). Le projet `grue` vient à l'étape 5 · l'offre gratuite limite à 2 projets actifs et met en pause un projet sans activité pendant 1 semaine. Source · [Supabase, Pricing](https://supabase.com/pricing).
2. **Site bêta** · GitHub > **New repository** `grue-beta`, **Public** > **Add file > Upload files** · le contenu d'`app-v3/` > **Commit changes**. Ouvre `config.js` > crayon (**Edit this file**) · URL et clé de `grue-beta`, `edition: "beta"` > **Commit changes**. **Settings > Pages** > `main` / `(root)` > **Save**.
3. **Contrôles bêta** · `https://<ton-pseudo>.github.io/grue-beta/`
   - La barre d'état affiche « v265.01 · bêta », sans « · démo » (sinon `Ctrl+F5`).
   - Réponds une fois. Supabase > **Table Editor** > `reponses` · la ligne est dans `grue-beta`, pas dans `grue`. Sinon les clés sont inversées · corrige `config.js`.
   - Puis envoie le lien aux testeurs.
4. **Après la bêta** · projet `grue-beta` > **SQL Editor** > `bilan.sql`, une requête à la fois, dont la 8 « Durée de remplissage » (durée réelle). Puis les corrections dans `app-v3/` (et `textes-v3.md`).
5. **Vraie version** · si l'organisation Supabase a déjà 2 projets actifs, supprime d'abord le projet `grue-beta` comme à l'étape 7, après l'export de ses totaux (étape 4). Crée `grue` comme à l'étape 1 · même région, même `schema.sql`, nouvelle URL et nouvelle clé. Puis même chemin qu'à l'étape 2, dépôt `grue`, avec l'URL et la clé de `grue` et `edition: ""`. Offre gratuite · une semaine sans réponse met `grue` en pause, vérifie chaque semaine qu'il est actif jusqu'à la fermeture. Contrôles · « v265.01 » seul, sans « · bêta » ni « · démo ». Une réponse test arrive dans `grue`, pas dans `grue-beta`. Vide la table de `grue` avant le mail (§ 4 de `app-v2/README.md`).
6. **Les testeurs** · ils peuvent répondre au vrai sondage. Leur navigateur garde la bêta sous `grue.v3.beta.deja`, à part.
7. **Ensuite** · exporte les totaux de la bêta si besoin, puis archive ou supprime le dépôt `grue-beta` (**Settings** > **General**, tout en bas · **Archive this repository** ou **Delete this repository**) et le projet `grue-beta` (Project Settings > General > **Delete project**).

## Sous le capot

- **Navigateur** · `localStorage` seulement, aucun cookie, rien n'est envoyé. Vraie version · `grue.v3.deja` et `grue.v3.demo`. Bêta · `grue.v3.beta.deja` et `grue.v3.beta.demo`. Jamais le pseudo.
- **Base** · pseudo, 15 cartes, 2 sujets proposés, tech hors IA et ses sujets, formats, 1:1, rôle, idée, raison de sortie, durée, version. Retirées depuis la v2 · `niveau`, `outils`, `editeurs`, `freins`, `i_chantier`, `i_calcul`, `i_elec`.
- **Envoi** · une seule requête vers `https://<projet>.supabase.co/rest/v1/reponses`, sans cookie ni referrer.
- **Police** · [VT323](https://github.com/google/fonts/tree/main/ofl/vt323) de Peter Hull, licence SIL Open Font License 1.1 (`fonts/OFL.txt`), hébergée avec le site. Le jeu latin est copié en base64 dans `style.css`, à l'identique de `fonts/vt323-latin.woff2` (vérifié par `tests-v3/contrast.test.mjs`) · la police arrive avec la feuille de style, sans requête à part. Lighthouse mobile ralenti, médianes `url()` → base64 · décalage de mise en page (CLS) 0,176 → 0,000, performance 87 → 94, premier affichage + 0,1 s (détail dans `../build-v3-avancement.md`).
  - Le premier écran attend aussi la police, 1 s au plus, fenêtre masquée (`app.js`, fin du fichier) · sinon le titre de l'accueil change de nombre de lignes quand VT323 arrive, et le GIF se décale. Au-delà d'1 s, l'accueil s'affiche avec la police de secours. Sans JavaScript, rien n'est masqué.
- **Accessibilité** visée · WCAG 2.2 AA. Tout au clavier (flèches sur les cartes, Entrée = bouton principal), focus visible, animations coupées si le système le demande, contraste élevé Windows respecté, affichage correct dès 320 px de large.
  - Vérifié · voir `../tests-v3/README.md` pour relancer les tests.
  - Reste à faire · un passage avec un vrai lecteur d'écran (NVDA ou VoiceOver).
