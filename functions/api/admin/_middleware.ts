/// <reference types="@cloudflare/workers-types" />
// Toutes les routes /api/admin/* : utilisateur vérifié obligatoire.
// Membres du CA (ADMIN_EMAILS) : tout l'admin. Membres du cahier de jeu hors CA : cahier de jeu seulement.
import { utilisateur } from "../../../server/access";
import { json, type Env } from "../../../server/db";
import { estCA, moi } from "../../../server/jeu";

const ROUTES_JEU = /^\/api\/admin\/(jeu(\/.*)?|moi|commentaires(\/\d+)?)$/;

export const onRequest: PagesFunction<Env, string, { email: string; ca: boolean }> = async (ctx) => {
  try {
    const email = await utilisateur(ctx.request, ctx.env, true);
    if (!email) return json({ error: "Accès refusé." }, 403);
    const ca = estCA(ctx.env, email) || (!!ctx.env.DEV_EMAIL && email === ctx.env.DEV_EMAIL.toLowerCase());
    if (!ca) {
      if (!ROUTES_JEU.test(new URL(ctx.request.url).pathname)) return json({ error: "Accès refusé." }, 403);
      if (!(await moi(ctx.env, email)).role) return json({ error: "Accès refusé." }, 403);
    }
    ctx.data.email = email;
    ctx.data.ca = ca;
    return await ctx.next();
  } catch (e) {
    return json({ error: (e as Error).message || "Erreur serveur." }, 500);
  }
};
