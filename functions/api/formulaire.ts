/// <reference types="@cloudflare/workers-types" />
// Fonction Cloudflare Pages : POST /api/formulaire
// Reçoit les formulaires (contact, commandite, précommande) et les envoie par courriel via Resend.
// Variables : RESEND_API_KEY (secret), TURNSTILE_SECRET (secret, optionnel), FORM_TO_INFO, FORM_TO_COMMANDITES, FORM_FROM.

import { db } from "../../server/db";

interface Env {
  DB?: D1Database;
  RESEND_API_KEY?: string;
  TURNSTILE_SECRET?: string;
  FORM_TO_INFO: string;
  FORM_TO_COMMANDITES: string;
  FORM_FROM: string;
}

const LIBELLES: Record<string, string> = {
  sujet: "Sujet", nom: "Nom", courriel: "Courriel", telephone: "Téléphone", message: "Message",
  entreprise: "Entreprise", forfait: "Forfait", entente: "Durée", article: "Article", taille: "Taille", quantite: "Quantité", total: "Total",
};
const TITRES = { contact: "Contact", commandite: "Demande de commandite", precommande: "Précommande boutique" } as const;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8" } });
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let d: Record<string, string>;
  try { d = await request.json(); } catch { return json({ error: "Requête invalide." }, 400); }

  const kind = d.kind as keyof typeof TITRES;
  if (!TITRES[kind]) return json({ error: "Formulaire inconnu." }, 400);
  if (d.site_web) return json({ ok: true }); // pot de miel : robot, on ignore sans le dire
  if (d.consentement !== "oui") return json({ error: "Le consentement est requis." }, 400);
  if (!d.nom?.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.courriel ?? "")) return json({ error: "Nom et courriel valides requis." }, 400);

  if (env.TURNSTILE_SECRET) {
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: d["cf-turnstile-response"] ?? "", remoteip: request.headers.get("cf-connecting-ip") ?? "" }),
    });
    const v = (await r.json()) as { success: boolean };
    if (!v.success) return json({ error: "Vérification anti-pourriel échouée." }, 400);
  }

  const lignes = Object.entries(d)
    .filter(([k, v]) => LIBELLES[k] && String(v).trim())
    .map(([k, v]) => [LIBELLES[k], String(v).slice(0, 4000)] as const);

  // 1) Enregistrement dans l'admin (table soumissions)
  let enregistre = false;
  if (env.DB) {
    try {
      const garder = Object.fromEntries(Object.entries(d).filter(([k]) => LIBELLES[k] || k === "total"));
      await (await db(env)).prepare("INSERT INTO soumissions (type, donnees) VALUES (?, ?)").bind(kind, JSON.stringify(garder)).run();
      enregistre = true;
    } catch (e) { console.log("D1", (e as Error).message); }
  }

  // 2) Courriel (si configuré)
  if (!env.RESEND_API_KEY) {
    return enregistre ? json({ ok: true }) : json({ error: "L’envoi n’est pas encore configuré." }, 503);
  }

  const to = kind === "commandite" ? env.FORM_TO_COMMANDITES : env.FORM_TO_INFO;
  const html = `<h2>${TITRES[kind]}</h2><table cellpadding="6">${lignes
    .map(([k, v]) => `<tr><td valign="top"><b>${esc(k)}</b></td><td>${esc(v).replace(/\n/g, "<br>")}</td></tr>`).join("")}</table>
    <p style="color:#888;font-size:12px">Envoyé depuis le site barracudasrugby.com. Consentement donné par l’expéditeur.</p>`;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: env.FORM_FROM, to: [to], reply_to: d.courriel,
      subject: `[Site] ${TITRES[kind]} · ${d.entreprise || d.nom}`.slice(0, 150), html,
    }),
  });
  if (!r.ok) { console.log("Resend", r.status, await r.text()); return enregistre ? json({ ok: true }) : json({ error: "Envoi impossible pour le moment." }, 502); }
  return json({ ok: true });
};
