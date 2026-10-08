/// <reference types="@cloudflare/workers-types" />
// Cahier de jeu — PUT : systèmes de jeu (structures 1-4-4-1, etc.) · éditeurs, contrôle de version.
import { json, journal, type Env } from "../../../../server/db";
import { dbJeu, moi, validerSysteme, Invalide } from "../../../../server/jeu";

export const onRequestPut = async (ctx: EventContext<Env, string, { email: string }>) => {
  const m = await moi(ctx.env, ctx.data.email);
  if (m.role !== "editeur") return json({ error: "Seuls les éditeurs peuvent modifier le système de jeu." }, 403);
  try {
    const b = (await ctx.request.json()) as { systeme: unknown; version: number };
    const p = validerSysteme(b.systeme);
    const r = await (await dbJeu(ctx.env)).prepare("UPDATE jeu_systeme SET donnees=?, version=version+1, maj_par=?, maj_le=datetime('now') WHERE id=1 AND version=? RETURNING version")
      .bind(JSON.stringify(p), m.email, Number(b.version)).first<{ version: number }>();
    if (!r) return json({ error: "Le système de jeu vient d’être modifié par quelqu’un d’autre. Recharge la page avant de réessayer." }, 409);
    await journal(ctx.env, m.email, "modifier", "jeu_systeme", 1);
    return json({ systeme: p, version: r.version });
  } catch (e) {
    return json({ error: e instanceof Invalide ? e.message : "Données invalides." }, 400);
  }
};
