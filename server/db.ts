/// <reference types="@cloudflare/workers-types" />
// Schéma de la base D1 de l'admin. Créé automatiquement au premier appel (CREATE TABLE IF NOT EXISTS).

export interface Env {
  DB?: D1Database;
  ADMIN_EMAILS?: string;       // liste séparée par des virgules
  ACCESS_TEAM_DOMAIN?: string; // ex. https://alfred-api.cloudflareaccess.com
  ACCESS_AUD?: string;         // « Application Audience (AUD) Tag » de l'application Access (optionnel mais recommandé)
  DEV_EMAIL?: string;          // développement local seulement (.dev.vars), jamais en production
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS taches (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     titre TEXT NOT NULL, details TEXT, responsable TEXT, echeance TEXT,
     statut TEXT NOT NULL DEFAULT 'a_faire', ordre REAL NOT NULL DEFAULT 0,
     cree_par TEXT, cree_le TEXT NOT NULL DEFAULT (datetime('now')), maj_le TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS commandites (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     entreprise TEXT NOT NULL, contact TEXT, courriel TEXT, telephone TEXT, site TEXT,
     forfait TEXT, entente TEXT, montant REAL, statut TEXT NOT NULL DEFAULT 'a_contacter',
     responsable TEXT, prochaine_action TEXT, prochaine_date TEXT, notes TEXT,
     cree_le TEXT NOT NULL DEFAULT (datetime('now')), maj_le TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS soumissions (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     type TEXT NOT NULL, donnees TEXT NOT NULL, statut TEXT NOT NULL DEFAULT 'nouveau', note TEXT,
     recu_le TEXT NOT NULL DEFAULT (datetime('now')), maj_le TEXT NOT NULL DEFAULT (datetime('now')))`,
  `CREATE TABLE IF NOT EXISTS journal (
     id INTEGER PRIMARY KEY AUTOINCREMENT, quand TEXT NOT NULL DEFAULT (datetime('now')),
     qui TEXT, action TEXT, objet TEXT, objet_id INTEGER)`,
];

let pret = false;
export async function db(env: Env): Promise<D1Database> {
  if (!env.DB) throw new Error("Base de données D1 non branchée (binding DB).");
  if (!pret) {
    await env.DB.batch(SCHEMA.map((s) => env.DB!.prepare(s)));
    pret = true;
  }
  return env.DB;
}

export async function journal(env: Env, qui: string, action: string, objet: string, id?: number) {
  try { await (await db(env)).prepare("INSERT INTO journal (qui, action, objet, objet_id) VALUES (?,?,?,?)").bind(qui, action, objet, id ?? null).run(); } catch { /* le journal ne bloque jamais */ }
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
