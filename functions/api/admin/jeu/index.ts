/// <reference types="@cloudflare/workers-types" />
// Cahier de jeu — GET : tout ce que l'utilisateur peut voir · POST : créer un jeu (éditeurs).
import { json, journal, type Env } from "../../../../server/db";
import { dbJeu, moi, validerJeu, versJeu, Invalide, type LigneJeu } from "../../../../server/jeu";

type Ctx = EventContext<Env, string, { email: string }>;

export const onRequestGet = async (ctx: Ctx) => {
  const m = await moi(ctx.env, ctx.data.email);
  if (!m.role) return json({ error: "Accès au cahier de jeu non autorisé." }, 403);
  const d = await dbJeu(ctx.env);
  // Les joueurs hors CA (lecteurs) ne voient que les jeux publiés ; CA et éditeurs voient aussi les brouillons.
  const tous = m.role === "editeur" || m.ca;
  const [j, s, mb] = await d.batch([
    d.prepare(`SELECT * FROM jeux ${tous ? "" : "WHERE statut='published'"} ORDER BY maj_le DESC`),
    d.prepare("SELECT donnees, version FROM jeu_systeme WHERE id=1"),
    d.prepare(`SELECT email, nom, role, postes FROM jeu_membres ${m.role === "editeur" ? "" : "WHERE email=?"} ORDER BY role, nom`)
      .bind(...(m.role === "editeur" ? [] : [m.email])),
  ]);
  const sys = s.results[0] as { donnees: string; version: number } | undefined;
  return json({
    moi: m,
    jeux: (j.results as LigneJeu[]).map(versJeu),
    // Anciennes données (liste de principes en texte) → aucun système défini.
    systeme: (() => { const d = sys ? JSON.parse(sys.donnees) : null; return d && !Array.isArray(d) && Array.isArray(d.systemes) ? d : { systemes: [] }; })(),
    versionSysteme: sys?.version ?? 0,
    membres: (mb.results as { postes: string }[]).map((x) => ({ ...x, postes: JSON.parse(x.postes || "[]") as number[] })),
  });
};

export const onRequestPost = async (ctx: Ctx) => {
  const m = await moi(ctx.env, ctx.data.email);
  if (m.role !== "editeur") return json({ error: "Seuls les éditeurs peuvent créer un jeu." }, 403);
  const corps = await ctx.request.text();
  if (corps.length > 1_000_000) return json({ error: "Ce jeu contient trop de données." }, 413);
  try {
    const p = validerJeu((JSON.parse(corps) as { jeu: unknown }).jeu);
    const r = await (await dbJeu(ctx.env)).prepare("INSERT INTO jeux (titre, categorie, statut, donnees, cree_par, maj_par) VALUES (?,?,?,?,?,?) RETURNING *")
      .bind(p.title, p.category, p.status, JSON.stringify(p), m.email, m.email).first<LigneJeu>();
    await journal(ctx.env, m.email, "creer", "jeux", r!.id);
    return json({ jeu: versJeu(r!) }, 201);
  } catch (e) {
    return json({ error: e instanceof Invalide ? e.message : "Données invalides." }, 400);
  }
};
