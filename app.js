/* GRUE.EXE v3 · sondage anonyme du channel Tech News Smart Control · équipe Smart Control
   JavaScript sans dépendance ni build · il se modifie à la main.
   Les textes viennent de textes-v3.md, sinon de textes-v2.md. L'interface suit la planche v3 (piste A). */
(() => {
  "use strict";

  const CFG = Object.assign(
    { supabaseUrl: "", supabaseKey: "", fermeture: "", lienChannel: "", edition: "" },
    window.GRUE_CONFIG || {}
  );
  const VERSION = "3.0";
  // Édition · "" (vraie version) ou "beta" (site de test, "bêta" accepté). Autre valeur · écran « Configuration à corriger. ».
  const EDITION = String(CFG.edition || "").trim().normalize("NFC").replace(/^bêta$/, "beta");
  const BETA = EDITION === "beta";
  // En bêta, le navigateur garde ses notes à part · sur la même origine github.io,
  // une réponse bêta n'affiche jamais « Déjà répondu. » sur le vrai site, et inversement.
  const CLE_DEMO = BETA ? "grue.v3.beta.demo" : "grue.v3.demo";
  const CLE_DEJA = BETA ? "grue.v3.beta.deja" : "grue.v3.deja";
  // Durée du sablier en démo, sans base branchée.
  const DUREE_ENVOI = 1600;
  const reduit = window.matchMedia("(prefers-reduced-motion: reduce)");
  const zone = document.getElementById("zone-question");

  /* ---------- Contenus ----------
     v ou id = identifiant enregistré en base (voir supabase/schema.sql),
     t = libellé, d = précision affichée après « · ». */
  const CARTES_DEV = [
    { id: "c_bases", t: "Les bases", d: "fonctionnement, capacités, limites" },
    { id: "c_copilot", t: "Configurer GitHub Copilot", d: "réglages, instructions, modèles" },
    { id: "c_agents", t: "Agents et skills", d: "créer, partager" },
    { id: "c_mcp", t: "MCP et connecteurs", d: "brancher l'IA sur nos outils" },
    { id: "c_tests", t: "Génération de tests", d: "Qt Test, cas de test" },
    { id: "c_revue", t: "Revue de code assistée", d: "C++ et QML" },
    { id: "c_existant", t: "Comprendre et documenter du code existant" },
    { id: "c_auto", t: "Automatisation", d: "tâches planifiées, hooks, CI" },
    { id: "c_vibe", t: "Vibe coding", d: "méthode, garde-fous, limites" },
    { id: "c_local", t: "IA en local", d: "un modèle sur ton poste, sans cloud" }
  ];
  const CARTES_INGE = [
    { id: "i_exigences", t: "Exigences et specs", d: "rédaction, qualité, traçabilité" },
    { id: "i_ihm", t: "IHM et design", d: "maquettes, Figma → QML" },
    { id: "i_grue", t: "IA sur la grue", d: "caméras, aide à la conduite, pannes anticipées" },
    { id: "i_ecologie", t: "IA et écologie", d: "énergie, eau, usages sobres" },
    // Identifiant v1 gardé · la carte M365 est dans le paquet 2 depuis la v2.
    { id: "c_m365", t: "M365 Copilot au quotidien", d: "mails, comptes rendus, Teams" }
  ];
  const TECH_HORS_IA = [
    { v: "oui", t: "Oui" },
    { v: "non", t: "Non" }
  ];
  const FORMATS = [
    { v: "posts", t: "Posts courts", d: "actu et astuces, 2 min de lecture" },
    { v: "tutos", t: "Tutos pas à pas", d: "à refaire sur ton poste" },
    { v: "demos", t: "Démos", d: "30 min, en live ou en replay" },
    { v: "defis", t: "Défis", d: "un petit problème, on compare les solutions" },
    { v: "outils", t: "Outils prêts à l'emploi", d: "agents, skills, prompts" }
  ];
  const UN_A_UN = [
    { v: "oui", t: "Oui" },
    { v: "plus_tard", t: "Peut-être plus tard" },
    { v: "non", t: "Non merci" }
  ];
  const ROLES = [
    { v: "lit", t: "Je lis" },
    { v: "reagit", t: "Je réagis et je pose des questions" },
    { v: "partage", t: "Je partage mes outils et mes astuces" },
    { v: "demo", t: "Je veux bien faire une démo" },
    { v: "referent", t: "Je veux bien être référent·e d'un sujet", d: "relayer l'actu et les questions de ce sujet" }
  ];
  const RAISONS = [
    { v: "temps", t: "Pas le temps en ce moment" },
    { v: "pas_ia", t: "L'IA, ça ne me parle pas" },
    { v: "canaux", t: "Déjà trop de canaux" },
    { v: "acces", t: "Pas d'accès ou pas autorisé" }
  ];
  // tampon · décor en anglais posé sur la carte pendant le glissé (LIKE, NOPE, ROOT).
  const CHOIX_CARTE = {
    non: { libelle: "Pas pour moi", fleche: "←", sens: "gauche", tampon: "nope" },
    maitrise: { libelle: "Je maîtrise", fleche: "↑", sens: "haut", tampon: "root" },
    interesse: { libelle: "Ça m'intéresse", fleche: "→", sens: "droite", tampon: "like" }
  };
  const CHOIX_DU_SENS = { gauche: "non", haut: "maitrise", droite: "interesse" };

  /* ---------- Pied de page · une blague par écran, aucune sur l'accueil et les paquets ---------- */
  const BLAGUE_TECH = "Il n'y a pas que l'IA dans la vie.";
  const BLAGUE_IDEE = "280 caractères max. Ici, les tokens sont gratuits.";
  const BLAGUE_ENVOI = "Thinking… Non, c'est juste l'envoi.";
  const BLAGUE_FIN = "Créé avec GitHub Copilot · Claude Opus 5.5, faute d'accès à Fable. Mais au fait, Fable, ça sert à quoi ?";
  const BLAGUE_DEJA = "Erreur 429 · trop de requêtes. Une réponse par personne suffit.";
  const BLAGUE_FERME = "Erreur 410 · Gone. Comme le sondage.";
  const ROTATION = [
    "Prompt système · sois honnête, c'est anonyme.",
    "Modèle sélectionné · toi. Raisonnement · élevé.",
    "Zéro token consommé. Ton cerveau tourne en local.",
    "Garanti sans trombone animé. Enfin, presque.",
    "Hallucinations · 0. Questions relues par un humain."
  ];

  /* ---------- Pseudo · Nom-Adjectif-0000, tiré sur le poste, jamais stocké dans le navigateur ---------- */
  const NOMS = ["Treuil", "Chariot", "Crochet", "Moufle", "Flèche", "Mât", "Câble", "Poulie", "Cabine", "Contrepoids", "Anémomètre", "Pupitre"];
  const ADJECTIFS = ["Zen", "Agile", "Calme", "Stable", "Rapide", "Solide", "Fiable", "Habile", "Sobre", "Robuste", "Souple", "Lucide"];
  // Tirage sans biais · on rejette les valeurs au-delà du dernier multiple de n.
  function hasard(n) {
    const plafond = Math.floor(0x100000000 / n) * n;
    const tirage = new Uint32Array(1);
    do { window.crypto.getRandomValues(tirage); } while (tirage[0] >= plafond);
    return tirage[0] % n;
  }
  const tirerPseudo = () =>
    `${NOMS[hasard(NOMS.length)]}-${ADJECTIFS[hasard(ADJECTIFS.length)]}-${String(hasard(10000)).padStart(4, "0")}`;

  const ETAPES = [
    { type: "cartes", id: "dev", titre: "Paquet 1/2 · IA et développement", cartes: CARTES_DEV, sujet: "sujet_dev", blague: false },
    { type: "cartes", id: "inge", titre: "Paquet 2/2 · IA au-delà du code", cartes: CARTES_INGE, sujet: "sujet_inge", blague: false },
    { type: "radio", champ: "tech_hors_ia", titre: "Dans le channel, tu veux aussi de la tech hors IA ?", options: TECH_HORS_IA,
      vide: "Choisis Oui ou Non.", sujets: { champ: "tech_sujets", libelle: "Quels sujets ?", si: "oui" }, blague: BLAGUE_TECH },
    { type: "checkbox", champ: "formats", titre: "Quels formats t'intéressent ?", sous: "Plusieurs choix possibles.", options: FORMATS,
      vide: "Coche au moins un format.", jauge: true },
    // 1:1 et participation sur un seul écran · le titre de l'étape est la première question.
    { type: "groupes", questions: [
      { type: "radio", champ: "un_a_un", titre: "Un 1:1 de 30 min, ça te dirait ?",
        sous: "Par exemple une démo sur ton travail ou le réglage de ton Copilot.", aide: "On proposera des créneaux dans le channel.",
        options: UN_A_UN, vide: "Choisis une réponse pour continuer." },
      { type: "radio", champ: "role", titre: "Comment tu veux participer ?", sous: "Un seul choix.", options: ROLES,
        vide: "Choisis une réponse pour continuer." }
    ] },
    { type: "texte", champ: "idee", max: 280, titre: "Une idée pour le channel ?",
      sous: "Un format, un outil à partager, autre chose. Facultatif, 280 caractères.", aide: "Sans nom ni info projet.",
      blague: BLAGUE_IDEE }
  ];
  const TOTAL = ETAPES.length;
  const MAX_SUJET = 120;
  const titreDe = (etape) => etape.titre || etape.questions[0].titre;

  const ERREURS = {
    reseau: ["Pas de connexion avec la base.", "Le réseau bloque peut-être le site de la base de données. Réessaie dans un instant."],
    delai: ["La base ne répond pas.", "Elle met trop de temps à répondre. Réessaie dans un instant."],
    charge: ["Trop de réponses en même temps.", "Réessaie dans une minute."],
    serveur: ["Erreur côté serveur.", "Réessaie dans une minute."],
    acces: ["La base refuse l'accès.", "Le problème vient de notre côté."],
    table: ["La base n'est pas prête.", "Il manque la table des réponses. Le problème vient de notre côté."],
    donnees: ["La base a refusé la réponse.", "Un contrôle de format a bloqué l'envoi. Le problème vient de notre côté."],
    inconnu: ["L'envoi n'a pas marché.", "Réessaie dans un instant."]
  };

  /* ---------- État ---------- */
  const nouvelEtat = () => ({
    ecran: "accueil",
    etape: 0,
    debut: 0,
    reponses: {
      cartes: {}, sujet_dev: "", sujet_inge: "", tech_hors_ia: null, tech_sujets: "",
      formats: [], un_a_un: null, role: null, idee: ""
    },
    ordres: {},
    envoi: false,
    dernier: null
  });
  let etat = nouvelEtat();
  // Tiré à chaque chargement, envoyé avec les réponses, jamais écrit dans le navigateur.
  let pseudo = tirerPseudo();
  let carteActive = null;
  let rotation = 0;
  let premierRendu = true;

  const stock = {
    lire(cle) {
      try { const v = localStorage.getItem(cle); return v === null ? null : JSON.parse(v); } catch (e) { return null; }
    },
    ecrire(cle, valeur) {
      try { localStorage.setItem(cle, JSON.stringify(valeur)); return true; } catch (e) { return false; }
    }
  };

  /* ---------- Petits outils ---------- */
  // Typo française · espace insécable avant ! ? ; : » · % et après «, pour qu'aucun signe ne commence une ligne.
  const typo = (t) => t.replace(/ ([!?;:»·%])/g, "\u00a0$1").replace(/« /g, "«\u00a0");
  function ajouter(el, enfants) {
    for (const c of [enfants].flat(Infinity)) {
      if (c === null || c === undefined || c === false) continue;
      el.append(c instanceof Node ? c : typo(String(c)));
    }
  }
  function h(tag, props, ...enfants) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === "class") el.className = v;
      else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : String(v));
    }
    ajouter(el, enfants);
    return el;
  }
  const NS = "http://www.w3.org/2000/svg";
  function s(tag, attrs, ...enfants) {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) if (v !== null && v !== undefined) el.setAttribute(k, String(v));
    ajouter(el, enfants);
    return el;
  }
  const deco = (texte) => h("span", { "aria-hidden": "true" }, texte);
  const srOnly = (texte) => h("span", { class: "sr-only" }, texte);
  const titreEcran = (...contenu) => h("h2", { class: "question", id: "q-titre", tabindex: "-1" }, ...contenu);
  // « 1/2 » se lit « un demi » · on affiche 1/2 et on fait lire « 1 sur 2 ».
  const fractions = (texte) => texte.split(/(\d+\/\d+)/).map((bout) => {
    const m = /^(\d+)\/(\d+)$/.exec(bout);
    return m ? [deco(bout), srOnly(`${m[1]} sur ${m[2]}`)] : bout;
  });
  const attendre = (ms) => new Promise((ok) => setTimeout(ok, ms));
  function aujourdhui() {
    const d = new Date();
    const n = (x) => String(x).padStart(2, "0");
    return `${d.getFullYear()}-${n(d.getMonth() + 1)}-${n(d.getDate())}`;
  }
  function melanger(liste) {
    const t = liste.slice();
    for (let i = t.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [t[i], t[j]] = [t[j], t[i]];
    }
    return t;
  }
  // Vider puis remplir · le lecteur d'écran réannonce même un message identique.
  function signaler(el, message) {
    el.textContent = "";
    setTimeout(() => { el.textContent = typo(message); }, 50);
  }
  const soumettre = (form) => (form.requestSubmit ? form.requestSubmit() : form.querySelector("[type=submit]").click());
  const interactif = (el) => !!(el && el.closest && el.closest("a[href], button, input, select, textarea, summary, [contenteditable]"));
  const EMAIL = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i;
  // Une seule ligne, espaces simplifiés, coupé à « max » caractères comme en base.
  const nettoyer = (texte, max) => Array.from(String(texte || "").replace(/\s+/g, " ").trim()).slice(0, max).join("").trim();

  // Boutons façon Windows 95 · « < », « > » et « ↵ » restent décoratifs, le nom lu est le mot.
  function bouton(texte, { principal = false, type = "button", avant = "", apres = "", onclick = null, attrs = {} } = {}) {
    const fin = [apres, principal ? "↵" : ""].filter(Boolean).join("\u00a0");
    return h("button", Object.assign({ type, class: principal ? "btn btn-principal" : "btn", onclick }, attrs),
      avant ? deco(`${avant}\u00a0`) : null, texte, fin ? deco(`\u00a0${fin}`) : null);
  }

  /* ---------- Configuration ---------- */
  function roleJwt(jeton) {
    try {
      const b64 = jeton.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(atob(b64)).role || "";
    } catch (e) { return ""; }
  }
  const FERMETURE = String(CFG.fermeture || "").trim();
  function dateValide(d) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d || ""));
    if (!m) return false;
    const t = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return t.getUTCFullYear() === +m[1] && t.getUTCMonth() === +m[2] - 1 && t.getUTCDate() === +m[3];
  }
  function analyserConfig() {
    const url = String(CFG.supabaseUrl || "").trim().replace(/\/+$/, "");
    const cle = String(CFG.supabaseKey || "").trim();
    const erreur = (raison) => ({ mode: "erreur", raison });
    if (cle.startsWith("sb_secret_")) return erreur("config.js contient une clé secrète (sb_secret_…). Retire-la et révoque-la dans Supabase. Mets la clé publishable à la place");
    if (cle.startsWith("eyJ") && roleJwt(cle) === "service_role") return erreur("config.js contient la clé service_role, qui est secrète. Retire-la et régénère-la dans Supabase. Mets la clé publishable à la place");
    if (FERMETURE && !dateValide(FERMETURE)) return erreur("Dans config.js, fermeture doit suivre le format AAAA-MM-JJ");
    if (EDITION && !BETA) return erreur("Dans config.js, edition doit valoir beta ou rester vide");
    if (!url && !cle) return { mode: "demo" };
    if (!url || !cle) return erreur("Renseigne supabaseUrl et supabaseKey dans config.js, ou laisse les deux vides pour le mode démo");
    if (!/^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(url)) return erreur("Dans config.js, supabaseUrl doit ressembler à https://abcd1234.supabase.co, sans chemin");
    if (cle.startsWith("sb_publishable_")) return { mode: "supabase", url, cle, jwt: false };
    if (cle.startsWith("eyJ") && roleJwt(cle) === "anon") return { mode: "supabase", url, cle, jwt: true };
    return erreur("Clé non reconnue dans config.js. Utilise la clé publishable, qui commence par sb_publishable_");
  }
  // ?demo dans l'adresse · teste le site en ligne sans rien envoyer.
  const CONF = (() => {
    const c = analyserConfig();
    if (c.mode === "supabase" && new URLSearchParams(window.location.search).has("demo")) return { mode: "demo" };
    return c;
  })();
  const estFerme = () => dateValide(FERMETURE) && aujourdhui() > FERMETURE;

  /* ---------- Grue en pixels · jauge du haut et écran de fin (décor, ignoré des lecteurs d'écran) ----------
     Grue à tour sans tête (flat-top), 60 × 40 pixels. */
  const pixel = (x, y, width, height, classe) => s("rect", { x, y, width, height, class: classe });
  const trait = (d) => s("path", { d, fill: "none", stroke: "currentColor", "stroke-width": 1 });
  const mat = (y) => [pixel(16, y, 1, 8), pixel(21, y, 1, 8), pixel(16, y, 6, 1),
    trait(`M16.5 ${y + 7.5}L21.5 ${y + 0.5}M16.5 ${y + 0.5}L21.5 ${y + 7.5}`)];
  const treillis = (x0, x1) => {
    let d = `M${x0 + 0.5} 4.5`;
    let haut = true;
    for (let x = x0 + 3; x <= x1; x += 3) {
      d += `L${x + 0.5} ${haut ? 1.5 : 4.5}`;
      haut = !haut;
    }
    return trait(d);
  };
  const cabine = () => s("path", { d: "M24 5h5v5h-5zM26 6h2v2h-2z", "fill-rule": "evenodd" });

  /* ---------- Jauge · barre Windows 95 et mini-grue ---------- */
  const jauge = document.getElementById("jauge");
  const voie = document.getElementById("jauge-voie");
  const jaugeEtape = document.getElementById("jauge-etape");
  const jaugeTexte = document.getElementById("jauge-texte");
  let grue = null;
  let piecesPosees = 0;

  // Une pièce par étape · 0 châssis, 1 mât, 2 pivot et cabine, 3 contre-flèche et lest, 4 flèche et chariot, 5 crochet.
  function construireGrue() {
    const pieces = [
      [pixel(15, 32, 8, 2), pixel(9, 34, 20, 2), pixel(9, 36, 4, 4), pixel(25, 36, 4, 4)],
      [mat(24), mat(16), mat(8)],
      [pixel(14, 5, 10, 3), cabine()],
      [pixel(1, 1, 18, 1), pixel(1, 4, 18, 1), treillis(1, 18), pixel(1, 5, 5, 6)],
      [pixel(19, 1, 41, 1), pixel(19, 4, 41, 1), treillis(19, 59), pixel(44, 5, 4, 2)],
      [pixel(45, 7, 1, 13), pixel(44, 20, 4, 3), pixel(46, 23, 1, 3), pixel(44, 26, 3, 1), pixel(44, 24, 1, 2)]
    ];
    return s("svg", { class: "grue", viewBox: "0 0 60 40", width: 60, height: 40, "aria-hidden": "true", focusable: "false" },
      pieces.map((p, k) => s("g", { "data-piece": k, class: "absente" }, p)));
  }

  // fait · nombre d'étapes terminées (0 à 5). L'étape n pose la pièce n, la grue suit le remplissage.
  // Les 100 % s'affichent sur l'écran de fin.
  function majJauge(fait, etiquette) {
    if (!grue) {
      grue = construireGrue();
      voie.prepend(grue);
    }
    const pct = Math.round((fait / TOTAL) * 100);
    jauge.hidden = false;
    jauge.style.setProperty("--pct", String(pct));
    jaugeEtape.textContent = etiquette || "";
    jaugeTexte.textContent = `Installing… ${pct}\u00a0%\u00a0⌛`;
    grue.querySelectorAll("[data-piece]").forEach((g) => {
      const k = Number(g.dataset.piece);
      g.classList.toggle("absente", k > fait);
      g.classList.toggle("pose", k <= fait && k > piecesPosees && !reduit.matches);
    });
    piecesPosees = fait;
  }
  const cacherJauge = () => { jauge.hidden = true; };

  // Grue complète, affichée × 2 à la fin. Le chariot avance, le crochet descend et pose la caisse « OK ».
  function construireGrueFin() {
    const crochet = s("g", { class: "crochet-groupe" }, [
      pixel(44, 26, 4, 3), pixel(46, 29, 1, 3), pixel(44, 32, 3, 1), pixel(44, 30, 1, 2),
      s("path", { class: "caisse", "fill-rule": "evenodd",
        d: "M40 33h11v7h-11zM42 34h3v5h-3zM43 35h1v3h-1zM46 34h1v5h-1zM48 34h1v1h-1zM47 35h1v1h-1zM47 37h1v1h-1zM48 38h1v1h-1z" })
    ]);
    return s("svg", { class: "grue-fin", viewBox: "0 0 60 40", width: 120, height: 80, "aria-hidden": "true", focusable: "false" }, [
      pixel(15, 32, 8, 2), pixel(9, 34, 20, 2), pixel(9, 36, 4, 4), pixel(25, 36, 4, 4),
      mat(24), mat(16), mat(8),
      pixel(14, 5, 10, 3), cabine(),
      pixel(1, 1, 18, 1), pixel(1, 4, 18, 1), treillis(1, 18),
      pixel(19, 1, 41, 1), pixel(19, 4, 41, 1), treillis(19, 59),
      pixel(1, 5, 5, 6),
      s("g", { class: "chariot-groupe" }, [pixel(44, 5, 4, 2), pixel(45, 7, 1, 19, "cable"), crochet])
    ]);
  }

  /* ---------- Affichage ---------- */
  const blague = document.getElementById("blague");
  // fixe · blague de l'écran, false = pas de blague (accueil, paquets, erreur d'envoi), absent = rotation.
  function majBlague(fixe) {
    blague.replaceChildren();
    if (fixe === false) return;
    ajouter(blague, [fixe || ROTATION[rotation++ % ROTATION.length]]);
  }

  function afficher(nom, contenu, titreDoc, blagueFixe) {
    carteActive = null;
    etat.ecran = nom;
    zone.replaceChildren();
    ajouter(zone, [contenu]);
    document.title = titreDoc;
    majBlague(blagueFixe);
    if (premierRendu) {
      premierRendu = false;
      return;
    }
    window.scrollTo(0, 0);
    (document.getElementById("q-titre") || zone).focus();
  }

  function lienChannel() {
    const url = String(CFG.lienChannel || "").trim();
    if (!/^https:\/\//i.test(url)) return null;
    return h("p", { class: "lien-channel" }, h("a", { href: url, target: "_blank", rel: "noopener noreferrer" },
      "Ouvrir le channel Tech News Smart Control", srOnly(" (nouvel onglet)")));
  }

  /* ---------- Accueil ---------- */
  // GIF « Channel en construction » (gif/fabrique_gif.py), lu une fois · image fixe si les animations sont réduites.
  const ALT_GIF = "Une grue hisse le panneau « Channel en construction » à l'envers, puis le retourne.";
  function gifAccueil() {
    const img = h("img", { width: 256, height: 132, alt: ALT_GIF });
    const image = h("picture", { class: "gif-accueil" },
      h("source", { srcset: "grue-en-construction-fixe.png", media: "(prefers-reduced-motion: reduce)" }), img);
    // src en dernier, l'image déjà dans <picture> · le navigateur ne charge que le fichier retenu.
    img.src = "grue-en-construction.gif";
    return image;
  }

  function rendreAccueil() {
    cacherJauge();
    const valeur = h("span", { class: "pseudo-valeur", id: "pseudo-accueil" }, pseudo);
    const annonce = h("p", { class: "sr-only", id: "annonce-pseudo", "aria-live": "polite" });
    const de = s("svg", { class: "de", "aria-hidden": "true", focusable: "false" }, s("use", { href: "#i-de" }));
    de.addEventListener("animationend", () => de.classList.remove("roule"));
    // « Autre pseudo » · à l'accueil seulement. À la fin, le pseudo est déjà envoyé avec les réponses.
    const autrePseudo = () => {
      let nouveau = tirerPseudo();
      while (nouveau === pseudo) nouveau = tirerPseudo();
      pseudo = nouveau;
      valeur.textContent = nouveau;
      signaler(annonce, `Nouveau pseudo · ${nouveau}`);
      if (reduit.matches) return;
      de.classList.remove("roule");
      void de.getBoundingClientRect();
      de.classList.add("roule");
    };
    afficher("accueil", [
      titreEcran("Salut ! On ouvre un channel tech pour Smart Control."),
      gifAccueil(),
      h("p", null, "Il s'appelle Tech News Smart Control. Avant de publier, on veut savoir ce qui t'intéresse."),
      h("ul", { class: "puces" },
        h("li", null, "1 à 2 minutes, 6 étapes."),
        h("li", null, "Anonyme, sans nom ni ", h("span", { class: "insecable" }, "e-mail"), ". Ici, tu es ", valeur, ".")),
      h("div", { class: "pseudo-relance" },
        h("button", { type: "button", class: "btn", id: "autre-pseudo", onclick: autrePseudo }, de, "Autre pseudo"),
        annonce),
      h("div", { class: "actions" },
        bouton("Démarrer", { principal: true, onclick: demarrer }),
        bouton("Pas pour moi", { onclick: rendreSortie }))
    ], "GRUE.EXE · Tech News Smart Control", false);
  }

  function demarrer() {
    etat = nouvelEtat();
    etat.debut = Date.now();
    rendreEtape();
  }

  /* ---------- Étapes · briques communes ---------- */
  const titreEtape = (etape, i) => titreEcran(srOnly(`Étape ${i + 1} sur ${TOTAL}. `), fractions(titreDe(etape)));
  const titreDocEtape = (etape, i) => `Étape ${i + 1}/${TOTAL} · ${titreDe(etape)} · GRUE.EXE`;
  const sousTitre = (etape) => (etape.sous ? h("p", { class: "sous", id: "q-sous" }, etape.sous) : null);
  const aide = (etape) => (etape.aide ? h("p", { class: "aide", id: "q-aide" }, etape.aide) : null);

  function boutonsEtape(i, derniere) {
    return h("div", { class: "actions" },
      i > 0 ? bouton("Précédent", { avant: "<", onclick: precedent }) : null,
      bouton(derniere ? "Envoyer" : "Suivant", { principal: true, type: "submit", apres: derniere ? "" : ">" }));
  }

  // Sélecteur piste A · case ou rond Windows 95 creusé, coche pixel.
  function option(nom, o, multiple, coche) {
    const id = `opt-${nom}-${o.v}`;
    return h("div", { class: "opt-a" },
      h("input", { type: multiple ? "checkbox" : "radio", id, name: nom, value: o.v, checked: coche }),
      h("label", { for: id },
        h("span", { class: multiple ? "boite" : "boite rond", "aria-hidden": "true" },
          multiple ? s("svg", { focusable: "false" }, s("use", { href: "#i-coche" })) : null),
        h("span", { class: "texte" }, o.t, o.d ? h("span", { class: "precision" }, ` · ${o.d}`) : null)));
  }

  // Entrée sur une case ou un bouton radio valide l'étape, comme le ↵ affiché.
  function entreeSoumet(form) {
    form.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && ev.target.matches("input[type=radio], input[type=checkbox]")) {
        ev.preventDefault();
        soumettre(form);
      }
    });
  }

  /* ---------- Étapes à choix · radio ou cases, une ou deux questions par écran ---------- */
  // Champ libre d'une ligne · « Un sujet manque ? » ou « Quels sujets ? ». Facultatif, 120 caractères.
  function champLibre(id, nom, libelle, erreur) {
    const entree = h("input", {
      type: "text", id, name: nom, maxlength: MAX_SUJET, autocomplete: "off", spellcheck: "true",
      "aria-describedby": `${id}-aide ${erreur.id}`
    });
    entree.value = etat.reponses[nom] || "";
    const compte = h("p", { class: "compte-car", "aria-hidden": "true" });
    const majCompte = () => { compte.textContent = `${entree.value.length}/${MAX_SUJET}`; };
    entree.addEventListener("input", () => {
      majCompte();
      erreur.textContent = "";
      etat.reponses[nom] = entree.value;
    });
    majCompte();
    const bloc = h("div", { class: "champ" },
      h("label", { for: id }, libelle),
      h("p", { class: "aide-champ", id: `${id}-aide` }, "Facultatif, 120 caractères."),
      entree, compte);
    return { bloc, entree };
  }

  // Jauge d'intérêt sous les formats · décor, ignorée des lecteurs d'écran.
  const LIBELLES_INTERET = ["", "Politesse.", "Curiosité.", "Intérêt.", "Passion.", "Tu animes le prochain live ?"];
  function construireJaugeInteret() {
    const cases = [0, 1, 2, 3, 4].map(() => h("span", { class: "bloc" }));
    const libelle = h("span", { class: "ji-libelle" });
    const el = h("div", { class: "jauge-interet", id: "jauge-interet", "aria-hidden": "true", hidden: true },
      h("span", { class: "ji-titre" }, "Jauge d'intérêt"),
      h("span", { class: "ji-blocs" }, cases),
      libelle);
    const maj = (nb) => {
      el.hidden = nb === 0;
      cases.forEach((x, k) => x.classList.toggle("plein", k < nb));
      libelle.textContent = typo(LIBELLES_INTERET[nb] || "");
    };
    return { el, maj };
  }

  function rendreChoix(etape, i) {
    const questions = etape.questions || [etape];
    const seule = questions.length === 1;
    const blocs = questions.map((q, k) => {
      const multiple = q.type === "checkbox";
      // Une question · ids v2 (q-sous, q-aide, q-erreur). Deux questions · suffixés par le champ.
      const suffixe = seule ? "" : `-${q.champ}`;
      const ids = { sous: `q-sous${suffixe}`, aide: `q-aide${suffixe}`, erreur: `q-erreur${suffixe}` };
      const valeur = etat.reponses[q.champ];
      const erreur = h("p", { class: "erreur", id: ids.erreur, role: "alert" });
      const legende = seule
        ? titreEtape(q, i)
        : h("h2", { class: "question-petite", id: k === 0 ? "q-titre" : null, tabindex: k === 0 ? "-1" : null },
          k === 0 ? srOnly(`Étape ${i + 1} sur ${TOTAL}. `) : null, fractions(q.titre));
      const interet = q.jauge ? construireJaugeInteret() : null;
      const sujets = q.sujets ? champLibre(`q-${q.sujets.champ}`, q.sujets.champ, q.sujets.libelle, erreur) : null;
      const decrit = [q.sous && ids.sous, q.aide && ids.aide, ids.erreur].filter(Boolean).join(" ");
      const bloc = h("div", { class: "bloc-question" },
        h("fieldset", { "aria-describedby": decrit },
          h("legend", null, legende),
          q.sous ? h("p", { class: "sous", id: ids.sous }, q.sous) : null,
          h("div", { class: "options" },
            q.options.map((o) => option(q.champ, o, multiple, multiple ? valeur.includes(o.v) : valeur === o.v))),
          interet ? interet.el : null),
        sujets ? sujets.bloc : null,
        erreur,
        q.aide ? h("p", { class: "aide", id: ids.aide }, q.aide) : null);
      const entrees = () => Array.from(bloc.querySelectorAll(`input[name="${q.champ}"]`));
      const lire = () => (multiple
        ? entrees().filter((x) => x.checked).map((x) => x.value)
        : (entrees().find((x) => x.checked) || {}).value || null);
      // Jauge d'intérêt, et « Quels sujets ? » visible seulement après « Oui ».
      const maj = () => {
        const v = lire();
        if (interet) interet.maj(v.length);
        if (sujets) sujets.bloc.hidden = v !== q.sujets.si;
      };
      return { q, multiple, erreur, bloc, entrees, lire, maj, sujets };
    });
    const form = h("form", { novalidate: true }, blocs.map((b) => b.bloc), boutonsEtape(i, false));

    form.addEventListener("change", (ev) => {
      const b = blocs.find((x) => x.q.champ === ev.target.name);
      if (!b) return;
      b.erreur.textContent = "";
      etat.reponses[b.q.champ] = b.lire();
      b.maj();
    });
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      let manque = null;
      for (const b of blocs) {
        const v = b.lire();
        if (b.multiple ? v.length === 0 : !v) {
          signaler(b.erreur, b.q.vide);
          manque = manque || b.entrees()[0];
        } else {
          etat.reponses[b.q.champ] = v;
        }
      }
      if (manque) {
        manque.focus();
        return;
      }
      for (const b of blocs) {
        if (!b.sujets || b.lire() !== b.q.sujets.si) continue;
        const texte = nettoyer(b.sujets.entree.value, MAX_SUJET);
        if (EMAIL.test(texte)) {
          signaler(b.erreur, "Retire l'adresse e-mail pour continuer.");
          b.sujets.entree.focus();
          return;
        }
        etat.reponses[b.q.sujets.champ] = texte;
      }
      avancer();
    });
    entreeSoumet(form);
    blocs.forEach((b) => b.maj());
    afficher("etape", form, titreDocEtape(etape, i), etape.blague);
  }

  /* ---------- Étape 6 · l'idée, facultative ---------- */
  function rendreIdee(etape, i) {
    const erreur = h("p", { class: "erreur", id: "q-erreur", role: "alert" });
    const compte = h("p", { class: "compte-car", "aria-hidden": "true" });
    const champ = h("textarea", {
      id: "q-idee", name: "idee", rows: 4, maxlength: etape.max, spellcheck: "true",
      "aria-labelledby": "q-titre", "aria-describedby": "q-sous q-aide q-erreur"
    });
    champ.value = etat.reponses.idee || "";
    const majCompte = () => { compte.textContent = `${champ.value.length}/${etape.max}`; };
    const form = h("form", { novalidate: true },
      titreEtape(etape, i), sousTitre(etape), champ, compte, erreur, aide(etape), boutonsEtape(i, true));

    champ.addEventListener("input", () => {
      majCompte();
      erreur.textContent = "";
      etat.reponses.idee = champ.value;
    });
    champ.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) {
        ev.preventDefault();
        soumettre(form);
      }
    });
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const texte = nettoyer(champ.value, etape.max);
      if (EMAIL.test(texte)) {
        signaler(erreur, "Retire l'adresse e-mail pour envoyer.");
        champ.focus();
        return;
      }
      etat.reponses.idee = texte;
      avancer();
    });
    majCompte();
    afficher("etape", form, titreDocEtape(etape, i), etape.blague);
  }

  /* ---------- Navigation entre étapes ---------- */
  function rendreEtape() {
    const i = etat.etape;
    const etape = ETAPES[i];
    majJauge(i, `Étape ${i + 1}/${TOTAL}`);
    if (etape.type === "cartes") rendreCartes(etape, i);
    else if (etape.type === "texte") rendreIdee(etape, i);
    else rendreChoix(etape, i);
  }

  function avancer() {
    if (etat.etape + 1 < TOTAL) {
      etat.etape += 1;
      rendreEtape();
    } else {
      envoyerPuis(payloadComplet(), "complet");
    }
  }

  function precedent() {
    if (etat.etape === 0) return;
    etat.etape -= 1;
    rendreEtape();
  }

  /* ---------- Paquets de cartes · glisser, boutons ou flèches du clavier ---------- */
  function ordreCartes(etape) {
    if (!etat.ordres[etape.id]) etat.ordres[etape.id] = melanger(etape.cartes.map((c) => c.id));
    return etat.ordres[etape.id].map((id) => etape.cartes.find((c) => c.id === id));
  }

  function rendreCartes(etape, i) {
    const liste = ordreCartes(etape);
    const n = liste.length;
    const rep = etat.reponses.cartes;
    let pos = liste.findIndex((c) => !rep[c.id]);
    if (pos === -1) pos = n; // paquet déjà trié · retour direct au bilan
    let verrou = false;
    let glisse = null;

    const compteurVu = h("span", { "aria-hidden": "true", id: "compteur-vu" });
    const compteurLu = h("span", { class: "sr-only", id: "compteur-lu" });
    const compteur = h("p", { class: "compteur", id: "compteur" }, compteurVu, compteurLu);
    const titreCarte = h("p", { class: "carte-titre", id: "carte-titre" });
    const precisionCarte = h("p", { class: "carte-precision", id: "carte-precision" });
    // Tampons · décor en anglais, comme la jauge.
    const tampons = {};
    for (const nom of ["like", "nope", "root"]) {
      tampons[nom] = h("span", { class: `tampon tampon-${nom}`, "data-tampon": nom, "aria-hidden": "true" }, nom.toUpperCase());
    }
    const carte = h("div", { class: "carte", id: "carte" }, titreCarte, precisionCarte, Object.values(tampons));
    const pile = h("div", { class: "pile", id: "pile" },
      h("div", { class: "carte-dessous d2", "aria-hidden": "true" }),
      h("div", { class: "carte-dessous d1", "aria-hidden": "true" }),
      carte);
    const boutons = {};
    const choix = h("div", { class: "choix-carte", role: "group", "aria-labelledby": "compteur-lu carte-titre carte-precision" },
      Object.keys(CHOIX_CARTE).map((cle) => {
        const c = CHOIX_CARTE[cle];
        boutons[cle] = h("button", { type: "button", class: "btn btn-carte", "data-choix": cle, "aria-pressed": "false", onclick: () => choisir(cle) },
          cle === "interesse" ? [c.libelle, deco(`\u00a0${c.fleche}`)] : [deco(`${c.fleche}\u00a0`), c.libelle]);
        return boutons[cle];
      }));
    const jeu = h("div", { class: "jeu", id: "jeu" },
      h("div", { class: "zone-pile" }, pile),
      h("p", { class: "note" }, "Swipe la carte ou utilise les flèches ← ↑ →"),
      choix);

    // Fin du paquet · bilan et champ libre « Un sujet manque ? »
    const bilan = h("p", { class: "bilan", id: "bilan", tabindex: "-1" });
    const erreur = h("p", { class: "erreur", id: "q-erreur", role: "alert" });
    const sujet = champLibre("q-sujet", etape.sujet, "Un sujet manque ?", erreur);
    const fin = h("div", { class: "paquet-fin", id: "paquet-fin", hidden: true }, bilan, sujet.bloc, erreur);
    const annonce = h("p", { class: "sr-only", id: "annonce-carte", "aria-live": "polite" });
    const btnEtapeAvant = i > 0 ? bouton("Précédent", { avant: "<", onclick: precedent }) : null;
    const btnCarteAvant = bouton("Carte précédente", { avant: "<", onclick: carteAvant, attrs: { id: "carte-precedente" } });
    const btnSuite = bouton("Suivant", { principal: true, type: "submit", apres: ">" });
    const actions = h("div", { class: "actions" }, btnEtapeAvant, btnCarteAvant, btnSuite);
    const form = h("form", { class: "paquet", id: "paquet", novalidate: true }, compteur, jeu, fin, actions, annonce);

    function afficherTampon(cle, opacite) {
      for (const [nom, el] of Object.entries(tampons)) {
        el.style.opacity = cle && CHOIX_CARTE[cle].tampon === nom ? String(opacite) : "";
      }
    }
    function marquer(cle) {
      for (const [k, b] of Object.entries(boutons)) b.setAttribute("aria-pressed", String(cle === k));
    }
    // Précédent au début du paquet, Carte précédente ensuite, Suivant au bilan.
    function majBoutons() {
      btnSuite.hidden = pos < n;
      btnCarteAvant.hidden = pos === 0;
      if (btnEtapeAvant) btnEtapeAvant.hidden = pos !== 0;
      actions.hidden = [btnEtapeAvant, btnCarteAvant, btnSuite].every((b) => !b || b.hidden);
    }
    // avecAnnonce · false au premier affichage, true après un choix ou « Carte précédente ».
    function afficherCarte(avecAnnonce) {
      const c = liste[pos];
      titreCarte.textContent = typo(c.t);
      precisionCarte.textContent = c.d ? typo(c.d) : "";
      precisionCarte.hidden = !c.d;
      compteurVu.textContent = `Carte ${pos + 1}/${n}`;
      compteurLu.textContent = `Carte ${pos + 1} sur ${n}`;
      pile.dataset.reste = String(Math.min(2, n - pos - 1));
      marquer(rep[c.id]);
      majBoutons();
      afficherTampon(null, 0);
      carte.style.transform = "";
      carteActive = { choisir };
      if (!avecAnnonce) return;
      signaler(annonce, `Carte ${pos + 1} sur ${n}. ${c.d ? `${c.t} · ${c.d}` : c.t}`);
      // Le bouton qui avait le focus a disparu · le focus va sur le choix déjà fait.
      const actif = document.activeElement;
      if (!actif || actif === document.body || actif.closest("[hidden]")) {
        (choix.querySelector("[aria-pressed=true]") || boutons.non).focus();
      }
    }
    function montrerFin(focus) {
      const nb = (cle) => liste.filter((c) => rep[c.id] === cle).length;
      bilan.textContent = typo(`Paquet trié · ${nb("interesse")} ça m'intéresse, ${nb("maitrise")} je maîtrise, ${nb("non")} pas pour moi.`);
      jeu.hidden = true;
      compteur.hidden = true;
      fin.hidden = false;
      carteActive = null;
      annonce.textContent = "";
      majBoutons();
      if (focus) bilan.focus();
    }
    function suivante() {
      pos += 1;
      if (pos >= n) {
        montrerFin(true);
        return;
      }
      afficherCarte(true);
      if (!reduit.matches) {
        carte.classList.remove("arrive");
        void carte.offsetWidth;
        carte.classList.add("arrive");
      }
    }
    carte.addEventListener("animationend", () => carte.classList.remove("arrive"));

    function choisir(cle) {
      if (verrou || pos >= n || !form.isConnected) return;
      const c = CHOIX_CARTE[cle];
      rep[liste[pos].id] = cle;
      // Animations réduites · la carte ne bouge pas, seul le tampon s'affiche.
      if (reduit.matches) {
        verrou = true;
        marquer(cle);
        carte.style.transform = "";
        afficherTampon(cle, 1);
        setTimeout(() => {
          verrou = false;
          if (form.isConnected) suivante();
        }, 350);
        return;
      }
      const envol = carte.cloneNode(true);
      envol.removeAttribute("id");
      envol.querySelectorAll("[id]").forEach((x) => x.removeAttribute("id"));
      envol.classList.remove("saisie", "arrive");
      envol.classList.add("carte-envol");
      envol.setAttribute("aria-hidden", "true");
      envol.querySelectorAll("[data-tampon]").forEach((tp) => {
        tp.style.opacity = tp.dataset.tampon === c.tampon ? "1" : "";
      });
      const depart = carte.style.transform || "translate(0px, 0px) rotate(0deg)";
      const arrivee = c.sens === "haut"
        ? "translate(0px, -130%) rotate(0deg)"
        : `translate(${c.sens === "gauche" ? "-" : ""}130%, 0px) rotate(${c.sens === "gauche" ? "-" : ""}20deg)`;
      const derniere = pos >= n - 1;
      pile.append(envol);
      carte.style.transform = "";
      afficherTampon(null, 0);
      const vol = envol.animate([{ transform: depart, opacity: 1 }, { transform: arrivee, opacity: 0 }],
        { duration: 320, easing: "ease-in", fill: "forwards" });
      // Dernière carte · le bilan attend la fin de l'envol, sinon l'envol serait masqué avec la pile.
      const atterrir = () => {
        envol.remove();
        if (!derniere) return;
        carte.style.visibility = "";
        verrou = false;
        if (form.isConnected) suivante();
      };
      vol.onfinish = atterrir;
      vol.oncancel = atterrir;
      if (derniere) {
        verrou = true;
        carte.style.visibility = "hidden";
        return;
      }
      suivante();
    }

    function carteAvant() {
      if (verrou || pos === 0) return;
      if (pos >= n) {
        fin.hidden = true;
        jeu.hidden = false;
        compteur.hidden = false;
        erreur.textContent = "";
        pos = n - 1;
      } else {
        pos -= 1;
      }
      afficherCarte(true);
    }

    // Glisser à la souris ou au doigt · la carte suit, le tampon apparaît selon la distance.
    const sensDuGlisse = (dx, dy) => (-dy > Math.abs(dx) ? "haut" : dx < 0 ? "gauche" : "droite");
    const distanceDuGlisse = (sens, dx, dy) => (sens === "haut" ? -dy : Math.abs(dx));
    const seuil = () => Math.min(120, carte.offsetWidth * 0.35);
    carte.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0 || verrou || pos >= n) return;
      glisse = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, dx: 0, dy: 0, actif: false };
      carte.setPointerCapture(ev.pointerId);
    });
    carte.addEventListener("pointermove", (ev) => {
      if (!glisse || ev.pointerId !== glisse.id) return;
      glisse.dx = ev.clientX - glisse.x;
      glisse.dy = ev.clientY - glisse.y;
      if (!glisse.actif) {
        if (Math.hypot(glisse.dx, glisse.dy) < 6) return;
        glisse.actif = true;
        carte.classList.add("saisie");
      }
      const sens = sensDuGlisse(glisse.dx, glisse.dy);
      afficherTampon(CHOIX_DU_SENS[sens], Math.min(1, Math.max(0, distanceDuGlisse(sens, glisse.dx, glisse.dy) / seuil())));
      if (!reduit.matches) {
        const angle = Math.max(-15, Math.min(15, glisse.dx * 0.06));
        carte.style.transform = `translate(${glisse.dx}px, ${glisse.dy}px) rotate(${angle}deg)`;
      }
    });
    function finGlisse(ev, annule) {
      if (!glisse || ev.pointerId !== glisse.id) return;
      const { dx, dy, actif } = glisse;
      glisse = null;
      carte.classList.remove("saisie");
      if (!actif) return;
      const sens = sensDuGlisse(dx, dy);
      if (!annule && distanceDuGlisse(sens, dx, dy) >= seuil()) {
        choisir(CHOIX_DU_SENS[sens]);
        return;
      }
      afficherTampon(null, 0);
      const depart = carte.style.transform;
      carte.style.transform = "";
      if (depart && !reduit.matches) {
        carte.animate([{ transform: depart }, { transform: "translate(0px, 0px) rotate(0deg)" }],
          { duration: 200, easing: "ease-out" });
      }
    }
    carte.addEventListener("pointerup", (ev) => finGlisse(ev, false));
    carte.addEventListener("pointercancel", (ev) => finGlisse(ev, true));

    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      if (pos < n) return;
      const texte = nettoyer(sujet.entree.value, MAX_SUJET);
      if (EMAIL.test(texte)) {
        signaler(erreur, "Retire l'adresse e-mail pour continuer.");
        sujet.entree.focus();
        return;
      }
      etat.reponses[etape.sujet] = texte;
      avancer();
    });

    afficher("etape", [titreEtape(etape, i), form], titreDocEtape(etape, i), etape.blague);
    if (pos >= n) montrerFin(false);
    else afficherCarte(false);
  }

  /* ---------- Envoi · mode démo (navigateur) ou Supabase ---------- */
  function dureeArrondie() {
    if (!etat.debut) return null;
    return Math.min(3600, Math.round((Date.now() - etat.debut) / 10000) * 10);
  }
  function payloadComplet() {
    const r = etat.reponses;
    const cartes = Object.fromEntries(CARTES_DEV.concat(CARTES_INGE).map((c) => [c.id, r.cartes[c.id] || null]));
    const tech = r.tech_hors_ia === "oui";
    return {
      version: VERSION, statut: "complet", pseudo,
      ...cartes,
      sujet_dev: nettoyer(r.sujet_dev, MAX_SUJET) || null,
      sujet_inge: nettoyer(r.sujet_inge, MAX_SUJET) || null,
      tech_hors_ia: r.tech_hors_ia,
      tech_sujets: tech ? nettoyer(r.tech_sujets, MAX_SUJET) || null : null,
      formats: r.formats, un_a_un: r.un_a_un, role: r.role,
      idee: nettoyer(r.idee, 280) || null,
      duree_s: dureeArrondie()
    };
  }
  const payloadSortie = (raison) => ({ version: VERSION, statut: "sortie", raison_sortie: raison || null });

  async function envoyer(payload) {
    if (CONF.mode !== "supabase") {
      await attendre(reduit.matches ? 300 : DUREE_ENVOI);
      const deja = stock.lire(CLE_DEMO);
      const liste = Array.isArray(deja) ? deja : [];
      // Le pseudo ne reste jamais dans le navigateur, même en démo.
      const copie = Object.assign({ jour: aujourdhui() }, payload);
      delete copie.pseudo;
      liste.push(copie);
      stock.ecrire(CLE_DEMO, liste.slice(-50));
      return { ok: true };
    }
    const ctrl = new AbortController();
    const minuteur = setTimeout(() => ctrl.abort(), 15000);
    const entetes = { "Content-Type": "application/json", apikey: CONF.cle, Prefer: "return=minimal" };
    if (CONF.jwt) entetes.Authorization = "Bearer " + CONF.cle; // ancienne clé anon · aussi en Authorization
    try {
      const rep = await fetch(`${CONF.url}/rest/v1/reponses`, {
        method: "POST", headers: entetes, body: JSON.stringify(payload),
        signal: ctrl.signal, credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer"
      });
      if (rep.ok) return { ok: true };
      let corps = null;
      try { corps = await rep.json(); } catch (e) { /* réponse sans JSON */ }
      return { ok: false, type: typeErreur(rep.status, corps || {}) };
    } catch (e) {
      return { ok: false, type: e && e.name === "AbortError" ? "delai" : "reseau" };
    } finally {
      clearTimeout(minuteur);
    }
  }

  // La règle RLS refuse tout après la date de fermeture · « row-level security » = sondage terminé.
  function typeErreur(statut, corps) {
    const texte = [corps.message, corps.details, corps.hint].filter(Boolean).join(" ").toLowerCase();
    if (texte.includes("row-level security")) return "ferme";
    if (statut === 401 || statut === 403 || texte.includes("permission denied")) return "acces";
    if (statut === 404 || corps.code === "PGRST205" || corps.code === "42P01") return "table";
    if (statut === 429) return "charge";
    if (statut >= 500) return "serveur";
    if (statut === 400 || statut === 409 || statut === 422) return "donnees";
    return "inconnu";
  }

  /* ---------- Scène d'envoi et de fin · façon GIF des années 90, jouée une fois ----------
     Sablier pendant l'envoi, puis jauge à 100 %, caisse « OK », badges et trombone.
     Animations réduites · l'état final s'affiche directement. */
  function construireScene(payload, complet) {
    const scene = document.getElementById("modele-scene").content.firstElementChild.cloneNode(true);
    const sablier = scene.querySelector(".sablier");
    const titreEnvoi = scene.querySelector(".envoi-texte");
    const etatFin = scene.querySelector(".etat-fin");
    titreEnvoi.id = "q-titre";
    if (!reduit.matches) sablier.classList.add("tourne");
    if (!complet) {
      etatFin.remove();
      return { scene, montrer: null };
    }
    scene.querySelector(".jauge-fin .jauge-voie").append(construireGrueFin());
    const pseudoValeur = scene.querySelector("#pseudo");
    const pseudoEtat = scene.querySelector("#pseudo-etat");
    pseudoValeur.textContent = payload.pseudo;
    scene.querySelector(".pseudo").after(...[lienChannel(), voirEnvoi(payload)].filter(Boolean));

    // « Copier » · presse-papiers, sinon le pseudo reste sélectionné pour Ctrl+C.
    scene.querySelector("#copier").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(pseudoValeur.textContent);
        signaler(pseudoEtat, "Pseudo copié.");
      } catch (e) {
        const plage = document.createRange();
        plage.selectNodeContents(pseudoValeur);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(plage);
        signaler(pseudoEtat, "Pseudo sélectionné, tu peux le copier.");
      }
    });

    // « Non merci » · la bulle se ferme, le trombone salue et repart. Le focus ne va jamais vers lui.
    const zoneTrombone = scene.querySelector("#trombone-zone");
    const trombone = scene.querySelector("#trombone");
    scene.querySelector("#non-merci").addEventListener("click", () => {
      const avaitLeFocus = zoneTrombone.contains(document.activeElement);
      scene.querySelector("#bulle").classList.add("est-cachee");
      if (avaitLeFocus) scene.querySelector(".depliable summary").focus();
      if (reduit.matches) {
        zoneTrombone.classList.add("est-parti");
        return;
      }
      trombone.classList.add("part");
    });
    trombone.addEventListener("animationend", (ev) => {
      if (ev.animationName === "salue") zoneTrombone.classList.add("est-parti");
    });

    const titreMerci = scene.querySelector(".merci-titre");
    const montrer = () => {
      stock.ecrire(CLE_DEJA, { statut: "complet" });
      etat.ecran = "fin";
      sablier.classList.remove("tourne");
      scene.dataset.etat = "fin";
      titreEnvoi.removeAttribute("id");
      titreMerci.id = "q-titre";
      document.title = "Merci, c'est envoyé · GRUE.EXE";
      majBlague(BLAGUE_FIN);
      if (!reduit.matches) {
        void etatFin.offsetWidth;
        etatFin.classList.add("joue");
      }
      titreMerci.focus();
    };
    return { scene, montrer };
  }

  async function envoyerPuis(payload, type) {
    if (etat.envoi) return;
    etat.envoi = true;
    etat.dernier = { payload, type };
    cacherJauge();
    const { scene, montrer } = construireScene(payload, type === "complet");
    afficher("envoi", scene, "Envoi en cours… · GRUE.EXE", BLAGUE_ENVOI);
    const res = await envoyer(payload);
    etat.envoi = false;
    if (res.ok) {
      if (montrer) montrer();
      else rendreMerci();
    } else if (res.type === "ferme") {
      rendreFerme();
    } else {
      rendreErreurEnvoi(res.type);
    }
  }

  /* ---------- Autres écrans ---------- */
  function voirEnvoi(payload) {
    const pre = h("pre", { class: "json" });
    pre.textContent = JSON.stringify(payload, null, 2);
    return h("details", { class: "depliable" }, h("summary", null, "Voir les données envoyées"), pre);
  }

  function rendreSortie() {
    cacherJauge();
    const form = h("form", { novalidate: true },
      h("fieldset", { "aria-describedby": "q-sous" },
        h("legend", null, titreEcran("Tu peux nous dire pourquoi ?")),
        h("p", { class: "sous", id: "q-sous" }, "Facultatif. Un seul choix."),
        h("div", { class: "options" }, RAISONS.map((o) => option("raison", o, false, false)))),
      h("div", { class: "actions" },
        bouton("Envoyer", { principal: true, type: "submit" }),
        bouton("Passer", { onclick: () => envoyerPuis(payloadSortie(null), "sortie") }),
        bouton("Finalement, je réponds", { avant: "<", onclick: demarrer })));
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const choisi = form.querySelector("input:checked");
      envoyerPuis(payloadSortie(choisi ? choisi.value : null), "sortie");
    });
    entreeSoumet(form);
    afficher("sortie", form, "Tu peux nous dire pourquoi ? · GRUE.EXE");
  }

  function rendreMerci() {
    stock.ecrire(CLE_DEJA, { statut: "sortie" });
    cacherJauge();
    afficher("merci", [
      titreEcran("Merci."),
      h("p", null, "Tu peux lire le channel quand tu veux."),
      lienChannel()
    ], "Merci · GRUE.EXE");
  }

  function rendreDeja(info) {
    cacherJauge();
    if (info.statut === "sortie") {
      afficher("deja", [
        titreEcran("Rebonjour."),
        h("p", null, "La dernière fois, tu as choisi « Pas pour moi ». Tu peux répondre maintenant si tu veux."),
        h("div", { class: "actions" }, bouton("Répondre", { principal: true, onclick: demarrer }))
      ], "Rebonjour · GRUE.EXE");
      return;
    }
    afficher("deja", [
      titreEcran("Déjà répondu."),
      h("p", null, "Une réponse a déjà été envoyée depuis ce navigateur. Les résultats seront publiés dans le channel après la clôture du sondage."),
      h("div", { class: "actions" },
        bouton("Nouvelle réponse", { onclick: rendreAccueil, attrs: { "aria-describedby": "note-poste" } })),
      h("p", { class: "note-poste", id: "note-poste" }, "Seulement si une autre personne répond sur ce poste.")
    ], "Déjà répondu · GRUE.EXE", BLAGUE_DEJA);
  }

  function rendreFerme() {
    cacherJauge();
    afficher("ferme", [
      titreEcran("Sondage terminé."),
      h("p", null, "Merci d'être passé·e. Les résultats sont partagés dans le channel Tech News Smart Control."),
      lienChannel()
    ], "Sondage terminé · GRUE.EXE", BLAGUE_FERME);
  }

  // Erreur d'envoi · pas de blague.
  function rendreErreurEnvoi(type) {
    const code = ERREURS[type] ? type : "inconnu";
    const [titre, texte] = ERREURS[code];
    afficher("erreur", [
      titreEcran(titre),
      h("p", null, texte),
      h("p", null, "Tes réponses sont gardées tant que cette page reste ouverte. Si ça bloque encore, signale-le dans le channel avec le code ",
        h("strong", null, code), "."),
      h("div", { class: "actions" },
        bouton("Réessayer", { principal: true, onclick: () => envoyerPuis(etat.dernier.payload, etat.dernier.type) }))
    ], `${titre.replace(/\.$/, "")} · GRUE.EXE`, false);
  }

  function rendreErreurConfig() {
    cacherJauge();
    afficher("config", [
      titreEcran("Configuration à corriger."),
      h("p", null, `${CONF.raison}. Ce message s'adresse à la personne qui gère le sondage. Si tu le vois en répondant, signale-le dans le channel.`)
    ], "Configuration à corriger · GRUE.EXE");
  }

  /* ---------- Clavier ---------- */
  document.addEventListener("keydown", (ev) => {
    if (ev.defaultPrevented || ev.isComposing) return;
    const cible = ev.target instanceof Element ? ev.target : null;
    const champ = !!(cible && cible.closest("input, textarea, select, [contenteditable]"));
    const modif = ev.ctrlKey || ev.altKey || ev.metaKey;
    // Paquets · ← Pas pour moi, ↑ Je maîtrise, → Ça m'intéresse.
    if (carteActive) {
      const cle = { ArrowLeft: "non", ArrowUp: "maitrise", ArrowRight: "interesse" }[ev.key];
      if (cle && !champ && !modif && !ev.shiftKey) {
        ev.preventDefault();
        if (!ev.repeat) carteActive.choisir(cle);
        return;
      }
    }
    // Entrée hors d'un élément interactif · action par défaut de l'écran, comme le ↵ du bouton principal.
    if (ev.key === "Enter" && !ev.repeat && !modif && !ev.shiftKey && !interactif(cible)) {
      const btn = Array.from(zone.querySelectorAll(".btn-principal")).find((b) => !b.disabled && b.getClientRects().length > 0);
      if (btn) {
        ev.preventDefault();
        btn.click();
      }
    }
  });

  /* ---------- Démarrage ---------- */
  function init() {
    // Garde-fous · « bêta » puis « démo » s'ajoutent à la version dans la barre d'état.
    const version = document.getElementById("version");
    if (BETA && version) version.textContent += " · bêta";
    if (CONF.mode === "demo" && version) version.textContent += " · démo";
    if (CONF.mode === "erreur") return rendreErreurConfig();
    if (estFerme()) return rendreFerme();
    const deja = stock.lire(CLE_DEJA);
    if (deja && typeof deja === "object") return rendreDeja(deja);
    return rendreAccueil();
  }

  // VT323 (data: URI de style.css) se décode à part. Le premier écran l'attend, au plus 1 s, fenêtre masquée :
  // sinon le titre de l'accueil change de nombre de lignes à l'arrivée de la police et décale le GIF.
  const POLICE = '1em "VT323"';
  if (document.fonts && !document.fonts.check(POLICE)) {
    document.documentElement.classList.add("attente-police");
    Promise.race([document.fonts.load(POLICE), attendre(1000)]).catch(() => {}).then(() => {
      document.documentElement.classList.remove("attente-police");
      init();
    });
  } else {
    init();
  }
})();
