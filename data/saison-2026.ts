// Saison 2026 · Poule P3 A · source : PlayHQ (Rugby Québec), relevé le 8 octobre 2026 (équipe P2-P3 Masculin, 10 matchs + demi-finale).
// Ne rien ajouter ici qui ne vient pas de PlayHQ.

export type Club = { code: string; nom: string; ecusson?: string };

export const CLUBS: Record<string, Club> = {
  BAR: { code: "BAR", nom: "Barracudas" }, // notre logo (SVG)
  NOM: { code: "NOM", nom: "Nomades", ecusson: "/crests/NOM.webp" },
  MTR: { code: "MTR", nom: "Mont-Tremblant", ecusson: "/crests/MTR.webp" },
  ARM: { code: "ARM", nom: "Armada", ecusson: "/crests/ARM.webp" },
  BRB: { code: "BRB", nom: "Barbs", ecusson: "/crests/BAR.webp" },
  TMR: { code: "TMR", nom: "TMR", ecusson: "/crests/TMR.webp" },
  SAB: { code: "SAB", nom: "Sainte-Anne-de-Bellevue", ecusson: "/crests/SAB.webp" },
  ORM: { code: "ORM", nom: "Ormstown", ecusson: "/crests/ORM.webp" },
};

export type Match = {
  date: string; // AAAA-MM-JJ
  phase: "Saison" | "Demi-finale";
  dom: string; // code club à domicile
  ext: string;
  scoreDom: number;
  scoreExt: number;
  lieu?: string;
  forfait?: boolean; // défaite par forfait des Barracudas
};

// Du plus récent au plus ancien
export const MATCHS: Match[] = [
  { date: "2026-08-08", phase: "Demi-finale", dom: "MTR", ext: "BAR", scoreDom: 55, scoreExt: 19, lieu: "Centre sportif Pays-d’en-Haut" },
  { date: "2026-08-01", phase: "Saison", dom: "BAR", ext: "MTR", scoreDom: 18, scoreExt: 35, lieu: "Terrain du Cégep de Saint-Jean" },
  { date: "2026-07-25", phase: "Saison", dom: "BRB", ext: "BAR", scoreDom: 0, scoreExt: 64, lieu: "Sunnybrook Park" },
  { date: "2026-07-11", phase: "Saison", dom: "BAR", ext: "TMR", scoreDom: 43, scoreExt: 12, lieu: "Polyvalente Chanoine-Armand-Racicot" },
  { date: "2026-07-04", phase: "Saison", dom: "BAR", ext: "NOM", scoreDom: 29, scoreExt: 22, lieu: "Polyvalente Chanoine-Armand-Racicot" },
  { date: "2026-06-27", phase: "Saison", dom: "ORM", ext: "BAR", scoreDom: 34, scoreExt: 7, lieu: "Chateauguay Valley Regional High School" },
  { date: "2026-06-13", phase: "Saison", dom: "ARM", ext: "BAR", scoreDom: 0, scoreExt: 101, lieu: "Parc Jeanne-Mance" },
  { date: "2026-06-06", phase: "Saison", dom: "BAR", ext: "SAB", scoreDom: 29, scoreExt: 12, lieu: "Polyvalente Chanoine-Armand-Racicot" },
  { date: "2026-05-30", phase: "Saison", dom: "BAR", ext: "BRB", scoreDom: 109, scoreExt: 0, lieu: "Polyvalente Chanoine-Armand-Racicot" },
  { date: "2026-05-16", phase: "Saison", dom: "MTR", ext: "BAR", scoreDom: 28, scoreExt: 0, lieu: "École secondaire Curé-Mercure", forfait: true },
  { date: "2026-05-09", phase: "Saison", dom: "NOM", ext: "BAR", scoreDom: 22, scoreExt: 12, lieu: "Parc Chênier" },
];

export type Ligne = { rang: number; club: string; j: number; v: number; d: number; diff: number; pts: number };

export const CLASSEMENT: Ligne[] = [
  { rang: 1, club: "NOM", j: 10, v: 8, d: 2, diff: 343, pts: 41 },
  { rang: 2, club: "MTR", j: 9, v: 6, d: 2, diff: 276, pts: 30 },
  { rang: 3, club: "BAR", j: 10, v: 6, d: 3, diff: 247, pts: 29 },
  { rang: 4, club: "ARM", j: 10, v: 2, d: 7, diff: -716, pts: 10 },
  { rang: 5, club: "BRB", j: 9, v: 0, d: 8, diff: -469, pts: 0 },
];

export const POULE = "Poule P3 A";
export const SOURCE = "Saison régulière 2026 · source PlayHQ, Rugby Québec";

export function resultat(m: Match): "V" | "D" | "N" {
  const nous = m.dom === "BAR" ? m.scoreDom : m.scoreExt;
  const eux = m.dom === "BAR" ? m.scoreExt : m.scoreDom;
  return nous > eux ? "V" : nous < eux ? "D" : "N";
}

const MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const MOIS_LONG = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
export function jourMois(iso: string) {
  const [, m, d] = iso.split("-").map(Number);
  return { jour: d, mois: MOIS[m - 1], moisLong: MOIS_LONG[m - 1] };
}
export function dateCourte(iso: string) {
  const { jour, mois } = jourMois(iso);
  return `${jour === 1 ? "1" : jour} ${mois}`;
}
export function dateLongue(iso: string) {
  const [y] = iso.split("-");
  const { jour, moisLong } = jourMois(iso);
  return `${jour} ${moisLong} ${y}`;
}
