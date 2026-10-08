/// <reference types="@cloudflare/workers-types" />
// Cahier de jeu — membres et rôles (éditeurs seulement).
// POST {email, nom, role, poste} : ajouter ou modifier · DELETE ?email= : retirer.
// Rappel : une personne hors CA doit aussi être ajoutée à la politique Cloudflare Access pour pouvoir se connecter.
import { json, journal, type Env } from "../../../../server/db";
import { dbJeu, moi } from "../../../../server/jeu";

type Ctx = EventContext<Env, string, { email: string }>;
const COURRIEL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const onRequestPost = async (ctx: Ctx) => {
  const m = await moi(ctx.env, ctx.data.email);
  if (m.role !== "editeur") return json({ error: "Seuls les éditeurs gèrent les membres." }, 403);
  const b = (await ctx.request.json()) as { email?: string; nom?: string; role?: string; poste?: number };
  const email = (b.email ?? "").trim().toLowerCase();
  const nom = (b.nom ?? "").trim().slice(0, 120);
  const poste = Number(b.poste);
  if (!COURRIEL.test(email) || email.length > 254) return json({ error: "Adresse courriel invalide." }, 400);
  if (!nom) return json({ error: "Le nom est requis." }, 400);
  if (b.role !== "editeur" && b.role !== "lecteur") return json({ error: "Rôle inconnu." }, 400);
  if (!Number.isInteger(poste) || poste < 1 || poste > 15) return json({ error: "Poste invalide." }, 400);
  if (email === m.email && b.role !== "editeur") return json({ error: "Tu ne peux pas retirer ton propre rôle d’éditeur." }, 400);
  await (await dbJeu(ctx.env)).prepare(`INSERT INTO jeu_membres (email, nom, role, poste, ajoute_par) VALUES (?,?,?,?,?)
      ON CONFLICT(email) DO UPDATE SET nom=excluded.nom, role=excluded.role, poste=excluded.poste`)
    .bind(email, nom, b.role, poste, m.email).run();
  await journal(ctx.env, m.email, `membre:${b.role}`, "jeu_membres");
  return json({ ok: true });
};

export const onRequestDelete = async (ctx: Ctx) => {
  const m = await moi(ctx.env, ctx.data.email);
  if (m.role !== "editeur") return json({ error: "Seuls les éditeurs gèrent les membres." }, 403);
  const email = (new URL(ctx.request.url).searchParams.get("email") ?? "").toLowerCase();
  if (email === m.email) return json({ error: "Tu ne peux pas te retirer toi-même." }, 400);
  await (await dbJeu(ctx.env)).prepare("DELETE FROM jeu_membres WHERE email=?").bind(email).run();
  await journal(ctx.env, m.email, "membre:retirer", "jeu_membres");
  return json({ ok: true });
};
