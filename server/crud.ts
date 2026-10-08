/// <reference types="@cloudflare/workers-types" />
// Petit CRUD générique et sûr (colonnes en liste blanche) pour les tables de l'admin.
import { db, journal, json, type Env } from "./db";

type Ctx = EventContext<Env, string, { email: string }>;

export function crud(table: string, colonnes: string[], requis: string[], tri: string) {
  const propre = (body: Record<string, unknown>) => {
    const o: Record<string, unknown> = {};
    for (const c of colonnes) if (c in body) {
      const v = body[c];
      o[c] = v === "" || v === undefined ? null : typeof v === "string" ? v.slice(0, 5000) : v;
    }
    return o;
  };
  return {
    async liste(ctx: Ctx) {
      const r = await (await db(ctx.env)).prepare(`SELECT * FROM ${table} ORDER BY ${tri} LIMIT 1000`).all();
      return json({ items: r.results });
    },
    async creer(ctx: Ctx) {
      const b = propre(await ctx.request.json());
      for (const k of requis) if (!b[k]) return json({ error: `Champ requis : ${k}` }, 400);
      if (table === "taches") b.cree_par = ctx.data.email;
      const cols = Object.keys(b);
      const r = await (await db(ctx.env)).prepare(`INSERT INTO ${table} (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")}) RETURNING *`).bind(...cols.map((c) => b[c])).first();
      await journal(ctx.env, ctx.data.email, "création", table, (r as { id: number }).id);
      return json({ item: r }, 201);
    },
    async modifier(ctx: Ctx) {
      const id = Number(ctx.params.id);
      const b = propre(await ctx.request.json());
      const cols = Object.keys(b);
      if (!id || !cols.length) return json({ error: "Rien à modifier." }, 400);
      const r = await (await db(ctx.env)).prepare(`UPDATE ${table} SET ${cols.map((c) => `${c}=?`).join(",")}, maj_le=datetime('now') WHERE id=? RETURNING *`).bind(...cols.map((c) => b[c]), id).first();
      if (!r) return json({ error: "Introuvable." }, 404);
      await journal(ctx.env, ctx.data.email, "modification", table, id);
      return json({ item: r });
    },
    async supprimer(ctx: Ctx) {
      const id = Number(ctx.params.id);
      await (await db(ctx.env)).prepare(`DELETE FROM ${table} WHERE id=?`).bind(id).run();
      await journal(ctx.env, ctx.data.email, "suppression", table, id);
      return json({ ok: true });
    },
  };
}
