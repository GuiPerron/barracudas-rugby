/// <reference types="@cloudflare/workers-types" />
// Cahier de jeu : tables D1, rôles et validation des données envoyées par le navigateur.
import { db, type Env } from "./db";
import { examplePlays } from "../lib/jeu/playbook";
import { nouveauSysteme } from "../lib/jeu/systeme";
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
     email TEXT PRIMARY KEY, nom TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'lecteur', postes TEXT NOT NULL DEFAULT '[]',
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
  const init = await d.prepare("INSERT OR IGNORE INTO jeu_systeme (id, donnees, maj_par) VALUES (1, ?, 'initialisation')").bind(JSON.stringify({ systemes: [nouveauSysteme("1-4-4-1")] })).run();
  if (init.meta.changes) {
    await d.batch([
      ...examplePlays.map((p) => d.prepare("INSERT INTO jeux (titre, categorie, statut, donnees, cree_par, maj_par) VALUES (?,?,?,?, 'exemple', 'exemple')")
        .bind(p.title, p.category, "draft", JSON.stringify({ ...p, status: "draft" }))),
      ...EDITEURS_INITIAUX.map(([e, n]) => d.prepare("INSERT OR IGNORE INTO jeu_membres (email, nom, role, ajoute_par) VALUES (?,?, 'editeur', 'initialisation')").bind(e, n)),
    ]);
  }
  await migrer(d);
  pret = true;
  return d;
}

/** Mises à jour de la base déjà en ligne (première version du cahier, 8 oct. 2026). */
async function migrer(d: D1Database) {
  // 1. Plusieurs postes par membre : colonne « postes » (liste JSON) au lieu de « poste ».
  const cols = (await d.prepare("PRAGMA table_info(jeu_membres)").all<{ name: string }>()).results.map((c) => c.name);
  if (!cols.includes("postes")) {
    await d.prepare("ALTER TABLE jeu_membres ADD COLUMN postes TEXT NOT NULL DEFAULT '[]'").run();
    if (cols.includes("poste")) await d.prepare("UPDATE jeu_membres SET postes = '[' || poste || ']'").run();
  }
  // 2. Système de jeu : l'ancienne liste de principes en texte devient une structure 1-4-4-1.
  const sys = await d.prepare("SELECT donnees FROM jeu_systeme WHERE id=1").first<{ donnees: string }>();
  if (sys && Array.isArray(JSON.parse(sys.donnees))) {
    await d.prepare("UPDATE jeu_systeme SET donnees=?, version=version+1, maj_par='migration' WHERE id=1")
      .bind(JSON.stringify({ systemes: [nouveauSysteme("1-4-4-1")] })).run();
  }
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
    if (ph.notes !== undefined) {
      ok(Array.isArray(ph.notes) && ph.notes.length <= 30, "Trop d’annotations.");
      for (const n of ph.notes as Record<string, unknown>[]) { texte(n.id, 100); texte(n.texte, 80, 1); coord(n.x); coord(n.y); }
    }
  }
  // On ne garde que les champs connus (rien d'autre n'est stocké).
  return {
    title: (p.title as string).trim(), category: p.category as string, format: p.format as string, status: p.status as string, summary: p.summary as string,
    phases: (p.phases as Record<string, unknown>[]).map((ph) => ({
      ...(ph.setup ? { setup: ph.setup } : {}), id: ph.id, name: ph.name, note: ph.note,
      players: (ph.players as Record<string, unknown>[]).map((j) => ({ id: j.id, x: j.x, y: j.y, team: j.team })),
      trails: (ph.trails as Record<string, unknown>[]).map((t) => ({ id: t.id, x1: t.x1, y1: t.y1, x2: t.x2, y2: t.y2, type: t.type })),
      ball: { x: (ph.ball as { x: number }).x, y: (ph.ball as { y: number }).y }, roles: ph.roles,
      notes: ((ph.notes as Record<string, unknown>[] | undefined) ?? []).map((n) => ({ id: n.id, x: n.x, y: n.y, texte: n.texte })),
    })),
  };
}

/** Système de jeu : { systemes: [{ id, nom, pods, rolesPods, note, placement }] } */
export function validerSysteme(v: unknown) {
  ok(!!v && typeof v === "object" && Array.isArray((v as { systemes?: unknown }).systemes), "Système invalide.");
  const liste = (v as { systemes: Record<string, unknown>[] }).systemes;
  ok(liste.length <= 10, "Maximum 10 systèmes.");
  return {
    systemes: liste.map((x) => {
      texte(x.id, 100, 1); texte(x.nom, 80, 1); texte(x.note ?? "", 4000);
      ok(Array.isArray(x.pods) && x.pods.length >= 1 && x.pods.length <= 8, "Entre 1 et 8 pods.");
      const vus = new Set<number>();
      for (const pod of x.pods as unknown[]) {
        ok(Array.isArray(pod) && pod.length >= 1 && pod.length <= 6, "Chaque pod a de 1 à 6 joueurs.");
        for (const n of pod as unknown[]) { ok(Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 15 && !vus.has(n as number), "Numéro de joueur invalide ou en double."); vus.add(n as number); }
      }
      ok(Array.isArray(x.rolesPods) && (x.rolesPods as unknown[]).length === (x.pods as unknown[]).length, "Rôles des pods invalides.");
      (x.rolesPods as unknown[]).forEach((r) => texte(r, 300));
      let placement: { id: number; x: number; y: number; team: "home" }[] | null = null;
      if (x.placement !== null && x.placement !== undefined) {
        ok(Array.isArray(x.placement) && (x.placement as unknown[]).length <= 15, "Placement invalide.");
        placement = (x.placement as Record<string, unknown>[]).map((j) => {
          ok(Number.isInteger(j.id) && (j.id as number) >= 1 && (j.id as number) <= 15, "Numéro de joueur invalide.");
          return { id: j.id as number, x: coord(j.x), y: coord(j.y), team: "home" as const };
        });
      }
      return { id: x.id as string, nom: (x.nom as string).trim(), pods: x.pods as number[][], rolesPods: x.rolesPods as string[], note: (x.note as string) ?? "", placement };
    }),
  };
}

/** Ligne D1 → objet Play envoyé au navigateur. */
export type LigneJeu = { id: number; donnees: string; version: number; statut: string; cree_par: string | null; maj_par: string | null; maj_le: string };
export const versJeu = (r: LigneJeu) => ({
  ...JSON.parse(r.donnees), id: String(r.id), status: r.statut, version: r.version,
  updatedAt: r.maj_le, updatedBy: r.maj_par, example: r.cree_par === "exemple" && r.maj_par === "exemple",
});
