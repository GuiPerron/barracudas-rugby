/// <reference types="@cloudflare/workers-types" />
// Toutes les routes /api/admin/* : utilisateur vérifié obligatoire.
import { utilisateur } from "../../../server/access";
import { json, type Env } from "../../../server/db";

export const onRequest: PagesFunction<Env, string, { email: string }> = async (ctx) => {
  const email = await utilisateur(ctx.request, ctx.env);
  if (!email) return json({ error: "Accès refusé." }, 403);
  ctx.data.email = email;
  try { return await ctx.next(); }
  catch (e) { return json({ error: (e as Error).message || "Erreur serveur." }, 500); }
};
