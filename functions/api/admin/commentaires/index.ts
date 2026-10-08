/// <reference types="@cloudflare/workers-types" />
// Commentaires attachés à une tâche, un commanditaire ou un jeu du cahier.
// GET ?objet=taches&id=3 → fil · GET sans paramètre → nombre par fiche · POST {objet, objet_id, texte}
import { db, journal, json, type Env } from "../../../../server/db";

const OBJETS = ["taches", "commandites", "jeux"];
type Ctx = EventContext<Env, string, { email: string; ca: boolean }>;
// Hors CA (membres du cahier de jeu) : seulement les commentaires des jeux.
const permis = (ctx: Ctx, objet: string) => OBJETS.includes(objet) && (ctx.data.ca || objet === "jeux");

export const onRequestGet = async (ctx: Ctx) => {
  const u = new URL(ctx.request.url);
  const objet = u.searchParams.get("objet");
  const id = Number(u.searchParams.get("id"));
  const d = await db(ctx.env);
  if (objet && permis(ctx, objet) && id) {
    const r = await d.prepare("SELECT * FROM commentaires WHERE objet=? AND objet_id=? ORDER BY cree_le, id").bind(objet, id).all();
    return json({ items: r.results });
  }
  const r = await d.prepare(`SELECT objet, objet_id, COUNT(*) n, MAX(cree_le) dernier FROM commentaires ${ctx.data.ca ? "" : "WHERE objet='jeux'"} GROUP BY objet, objet_id`).all();
  return json({ comptes: r.results });
};

export const onRequestPost = async (ctx: Ctx) => {
  const b = (await ctx.request.json()) as { objet?: string; objet_id?: number; texte?: string };
  const texte = (b.texte ?? "").trim().slice(0, 4000);
  if (!b.objet || !permis(ctx, b.objet) || !Number(b.objet_id) || !texte) return json({ error: "Commentaire vide ou fiche inconnue." }, 400);
  const r = await (await db(ctx.env)).prepare("INSERT INTO commentaires (objet, objet_id, auteur, texte) VALUES (?,?,?,?) RETURNING *")
    .bind(b.objet, Number(b.objet_id), ctx.data.email, texte).first();
  await journal(ctx.env, ctx.data.email, "commentaire", b.objet, Number(b.objet_id));
  return json({ item: r }, 201);
};
