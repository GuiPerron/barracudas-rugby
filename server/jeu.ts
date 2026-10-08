/// <reference types="@cloudflare/workers-types" />
// Cahier de jeu : tables D1, rôles et validation des données envoyées par le navigateur.
import { db, type Env } from "./db";
import { examplePlays, examplePrinciples } from "../lib/jeu/playbook";
import { formationIds } from "../lib/jeu/formations";

export type Role = "editeur" | "lecteur";
export type Moi = { email: string; ca: boolean; role: Role | null };

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS jeux (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     titre TEXT NOT NULL, categorie TEXT NOT NULL, statut TEXT NOT NULL DEFAULT 'draft',
     donnees TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1,
     cree_par TEXT, maj_par TEXT, maj_le TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS jeu_systeme (
     id INTEGER PRIMARY KEY CHECK (id = 1), donnees TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1,
     maj_par TEXT, maj_le TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS jeu_membres (
     email TEXT PRIMARY KEY, nom TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'lecteur', poste INTEGER NOT NULL DEFAULT 9,
     ajoute_par TEXT, ajoute_le TEXT NOT NULL DEFAULT (datetime('now')))`,
];

/** Premiers éditeurs (Christophe = direction technique, Guillaume = admin du site). */
const EDITEURS_INITIAUX: [string, string][] = [
  ["technique@barracudasrugby.com", "Christophe Morin"],
  ["guillaume.perron@barracudasrugby.com", "Guillaume Perron"],
];

let pret = false;
export async function dbJeu(env: Env): Promise<D1Database> {
  const d = await db(env);
  if (pret) return d;
  await d.batch(SCHEMA.map((s) => d.prepare(s)));
  // Initialisation unique : la ligne jeu_systeme sert de verrou (INSERT OR IGNORE).
  const init = await d.prepare("INSERT OR IGNORE INTO jeu_systeme (id, donnees, maj_par) VALUES (1, ?, 'initialisation')").bind(JSON.stringify(examplePrinciples)).run();
  if (init.meta.changes) {
    await d.batch([
      ...examplePlays.map((p) => d.prepare("INSERT INTO jeux (titre, categorie, statut, donnees, cree_par, maj_par) VALUES (?,?,?,?, 'exemple', 'exemple')")
        .bind(p.title, p.category, "draft", JSON.stringify({ ...p, status: "draft" }))),
      ...EDITEURS_INITIAUX.map(([e, n]) => d.prepare("INSERT OR IGNORE INTO jeu_membres (email, nom, role, ajoute_par) VALUES (?,?, 'editeur', 'initialisation')").bind(e, n)),
    ]);
  }
  pret = true;
  return d;
}

export const estCA = (env: Env, email: string) =>
  (env.ADMIN_EMAILS ?? "").split(",").map((x) => x.trim().toLowerCase()).includes(email.toLowerCase());

/** Rôle dans le cahier : la table jeu_membres décide ; un membre du CA absent de la table est lecteur. */
export async function moi(env: Env, email: string): Promise<Moi> {
  const d = await dbJeu(env);
  const r = await d.prepare("SELECT role FROM jeu_membres WHERE email=?").bind(email).first<{ role: Role }>();
  const ca = estCA(env, email);
  return { email, ca, role: r?.role ?? (ca ? "lecteur" : null) };
}

/* ---------------- Validation (même règles que l'outil d'origine) ---------------- */
export class Invalide extends Error {}
const ok = (c: boolean, m: string) => { if (!c) throw new Invalide(m); };
const texte = (v: unknown, max: number, min = 0) => { ok(typeof v === "string" && v.length <= max && v.trim().length >= min, "Texte invalide ou trop long."); return v as string; };
const coord = (v: unknown) => { ok(typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1000, "Coordonnée hors terrain."); return v as number; };
const CATEGORIES = ["Attaque", "Défense", "Conquête", "Relance"];

export function validerJeu(v: unknown) {
  ok(!!v && typeof v === "object", "Jeu invalide.");
  const p = v as Record<string, unknown>;
  texte(p.title, 120, 1); texte(p.summary, 2000);
  ok(CATEGORIES.includes(p.category as string), "Famille de jeu inconnue.");
  ok(p.format === "XV" || p.format === "7", "Format inconnu.");
  ok(p.status === "draft" || p.status === "published", "Statut inconnu.");
  ok(Array.isArray(p.phases) && p.phases.length >= 1 && p.phases.length <= 20, "Entre 1 et 20 phases.");
  for (const ph of p.phases as Record<string, unknown>[]) {
    ok(!!ph && typeof ph === "object", "Phase invalide.");
    texte(ph.id, 100); texte(ph.name, 100, 1); texte(ph.note, 6000);
    if (ph.setup !== undefined) ok((formationIds as readonly string[]).includes(ph.setup as string), "Formation inconnue.");
    ok(Array.isArray(ph.players) && ph.players.length <= 30, "Trop de joueurs.");
    for (const j of ph.players as Record<string, unknown>[]) {
      ok(Number.isInteger(j.id) && (j.id as number) >= 1 && (j.id as number) <= 15, "Numéro de joueur invalide.");
      coord(j.x); coord(j.y); ok(j.team === "home" || j.team === "away", "Équipe invalide.");
    }
    ok(Array.isArray(ph.trails) && ph.trails.length <= 100, "Trop de tracés.");
    for (const t of ph.trails as Record<string, unknown>[]) {
      texte(t.id, 100); coord(t.x1); coord(t.y1); coord(t.x2); coord(t.y2);
      ok(["run", "pass", "kick"].includes(t.type as string), "Type de tracé inconnu.");
    }
    const b = ph.ball as Record<string, unknown>; ok(!!b, "Ballon manquant."); coord(b.x); coord(b.y);
    ok(!!ph.roles && typeof ph.roles === "object", "Consignes invalides.");
    for (const [k, r] of Object.entries(ph.roles as object)) { ok(/^(?:[1-9]|1[0-5])$/.test(k), "Poste invalide."); texte(r, 4000); }
  }
  // On ne garde que les champs connus (rien d'autre n'est stocké).
  return {
    title: (p.title as string).trim(), category: p.category as string, format: p.format as string, status: p.status as string, summary: p.summary as string,
    phases: (p.phases as Record<string, unknown>[]).map((ph) => ({
      ...(ph.setup ? { setup: ph.setup } : {}), id: ph.id, name: ph.name, note: ph.note,
      players: (ph.players as Record<string, unknown>[]).map((j) => ({ id: j.id, x: j.x, y: j.y, team: j.team })),
      trails: (ph.trails as Record<string, unknown>[]).map((t) => ({ id: t.id, x1: t.x1, y1: t.y1, x2: t.x2, y2: t.y2, type: t.type })),
      ball: { x: (ph.ball as { x: number }).x, y: (ph.ball as { y: number }).y }, roles: ph.roles,
    })),
  };
}

export function validerPrincipes(v: unknown) {
  ok(Array.isArray(v) && v.length <= 20, "Maximum 20 principes.");
  return (v as Record<string, unknown>[]).map((p) => ({ id: texte(p.id, 100, 1), title: texte(p.title, 120, 1), text: texte(p.text, 6000) }));
}

/** Ligne D1 → objet Play envoyé au navigateur. */
export type LigneJeu = { id: number; donnees: string; version: number; statut: string; cree_par: string | null; maj_par: string | null; maj_le: string };
export const versJeu = (r: LigneJeu) => ({
  ...JSON.parse(r.donnees), id: String(r.id), status: r.statut, version: r.version,
  updatedAt: r.maj_le, updatedBy: r.maj_par, example: r.cree_par === "exemple" && r.maj_par === "exemple",
});
