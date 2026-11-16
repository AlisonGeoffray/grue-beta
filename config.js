/* GRUE.EXE v3 · réglages
   Laisse supabaseUrl et supabaseKey vides pour le MODE DÉMO
   (rien n'est envoyé, les réponses restent dans le navigateur).
   Le README explique où trouver ces valeurs dans Supabase. */
window.GRUE_CONFIG = {
  // Ex. "https://abcdefghijklmnop.supabase.co", sans chemin ni barre finale.
  supabaseUrl: "https://pghjjqlxbgkpnysnhpaj.supabase.co",

  // Clé PUBLISHABLE uniquement · "sb_publishable_..." (ou l'ancienne clé "anon").
  // Jamais la clé secrète "sb_secret_..." ni "service_role" · l'app les refuse.
  supabaseKey: "sb_publishable_Z1Rs6SSGY88dYk05APvz4Q_FonKFQKW",

  // Dernier jour pour répondre, format AAAA-MM-JJ. Vide = pas de fermeture côté app.
  // Garde la même date que dans supabase/schema.sql (règle depot_anonyme).
  fermeture: "2026-12-31",

  // Lien https vers le channel Teams, affiché à la fin. Vide = pas de lien.
  lienChannel: "",

  // "beta" pour le site de test, vide pour la vraie version.
  // Le site bêta a son propre projet Supabase · voir « Bêta, puis vraie version » dans le README.
  edition: "beta"
};
