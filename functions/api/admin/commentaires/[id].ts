/// <reference types="@cloudflare/workers-types" />
// Supprimer son propre commentaire (seulement l'auteur).
import { db, json, type Env } from "../../../../server/db";
export const onRequestDelete = async (ctx: EventContext<Env, string, { email: string }>) => {
  const r = await (await db(ctx.env)).prepare("DELETE FROM commentaires WHERE id=? AND auteur=?").bind(Number(ctx.params.id), ctx.data.email).run();
  return r.meta.changes ? json({ ok: true }) : json({ error: "Seul l'auteur peut supprimer son commentaire." }, 403);
};
