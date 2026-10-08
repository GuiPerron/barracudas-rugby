/// <reference types="@cloudflare/workers-types" />
// Cahier de jeu — PUT : enregistrer un jeu (contrôle de version) · DELETE : supprimer (éditeurs).
import { json, journal, type Env } from "../../../../server/db";
import { dbJeu, moi, validerJeu, versJeu, Invalide, type LigneJeu } from "../../../../server/jeu";

type Ctx = EventContext<Env, string, { email: string }>;

export const onRequestPut = async (ctx: Ctx) => {
  const m = await moi(ctx.env, ctx.data.email);
  if (m.role !== "editeur") return json({ error: "Seuls les éditeurs peuvent modifier un jeu." }, 403);
  const id = Number(ctx.params.id);
  const corps = await ctx.request.text();
  if (corps.length > 1_000_000) return json({ error: "Ce jeu contient trop de données." }, 413);
  try {
    const b = JSON.parse(corps) as { jeu: unknown; version: number };
    const p = validerJeu(b.jeu);
    const d = await dbJeu(ctx.env);
    const r = await d.prepare(`UPDATE jeux SET titre=?, categorie=?, statut=?, donnees=?, version=version+1, maj_par=?, maj_le=datetime('now')
                               WHERE id=? AND version=? RETURNING *`)
      .bind(p.title, p.category, p.status, JSON.stringify(p), m.email, id, Number(b.version)).first<LigneJeu>();
    if (!r) {
      const actuel = await d.prepare("SELECT j.maj_par, m.nom FROM jeux j LEFT JOIN jeu_membres m ON m.email = j.maj_par WHERE j.id=?").bind(id).first<{ maj_par: string; nom: string | null }>();
      if (!actuel) return json({ error: "Ce jeu a été supprimé." }, 404);
      return json({ error: `Ce jeu vient d’être modifié par ${actuel.nom ?? actuel.maj_par}. Garde une copie de tes changements, puis recharge le jeu.` }, 409);
    }
    await journal(ctx.env, m.email, p.status === "published" ? "publier" : "modifier", "jeux", id);
    return json({ jeu: versJeu(r) });
  } catch (e) {
    return json({ error: e instanceof Invalide ? e.message : "Données invalides." }, 400);
  }
};

export const onRequestDelete = async (ctx: Ctx) => {
  const m = await moi(ctx.env, ctx.data.email);
  if (m.role !== "editeur") return json({ error: "Seuls les éditeurs peuvent supprimer un jeu." }, 403);
  const id = Number(ctx.params.id);
  const d = await dbJeu(ctx.env);
  await d.batch([
    d.prepare("DELETE FROM jeux WHERE id=?").bind(id),
    d.prepare("DELETE FROM commentaires WHERE objet='jeux' AND objet_id=?").bind(id),
  ]);
  await journal(ctx.env, m.email, "supprimer", "jeux", id);
  return json({ ok: true });
};
