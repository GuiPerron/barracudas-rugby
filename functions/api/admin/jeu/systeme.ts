/// <reference types="@cloudflare/workers-types" />
// Cahier de jeu — PUT : principes du système de jeu (éditeurs, contrôle de version).
import { json, journal, type Env } from "../../../../server/db";
import { dbJeu, moi, validerPrincipes, Invalide } from "../../../../server/jeu";

export const onRequestPut = async (ctx: EventContext<Env, string, { email: string }>) => {
  const m = await moi(ctx.env, ctx.data.email);
  if (m.role !== "editeur") return json({ error: "Seuls les éditeurs peuvent modifier le système de jeu." }, 403);
  try {
    const b = (await ctx.request.json()) as { principes: unknown; version: number };
    const p = validerPrincipes(b.principes);
    const r = await (await dbJeu(ctx.env)).prepare("UPDATE jeu_systeme SET donnees=?, version=version+1, maj_par=?, maj_le=datetime('now') WHERE id=1 AND version=? RETURNING version")
      .bind(JSON.stringify(p), m.email, Number(b.version)).first<{ version: number }>();
    if (!r) return json({ error: "Le système de jeu vient d’être modifié par quelqu’un d’autre. Recharge la page avant de réessayer." }, 409);
    await journal(ctx.env, m.email, "modifier", "jeu_systeme", 1);
    return json({ principes: p, version: r.version });
  } catch (e) {
    return json({ error: e instanceof Invalide ? e.message : "Données invalides." }, 400);
  }
};
