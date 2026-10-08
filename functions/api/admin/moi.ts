/// <reference types="@cloudflare/workers-types" />
import { db, json, type Env } from "../../../server/db";
// Qui suis-je + compteurs du tableau de bord
export const onRequestGet: PagesFunction<Env, string, { email: string; ca: boolean }> = async (ctx) => {
  if (!ctx.data.ca) return json({ email: ctx.data.email, ca: false });
  const d = await db(ctx.env);
  const [t, c, s] = await d.batch([
    d.prepare("SELECT statut, COUNT(*) n FROM taches GROUP BY statut"),
    d.prepare("SELECT statut, COUNT(*) n, COALESCE(SUM(montant),0) total FROM commandites GROUP BY statut"),
    d.prepare("SELECT type, COUNT(*) n FROM soumissions WHERE statut='nouveau' GROUP BY type"),
  ]);
  return json({ email: ctx.data.email, ca: true, taches: t.results, commandites: c.results, soumissions: s.results });
};
