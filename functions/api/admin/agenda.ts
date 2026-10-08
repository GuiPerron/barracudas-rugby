/// <reference types="@cloudflare/workers-types" />
// Événements de Google Agenda « Barracudas · Club » via l'adresse iCal secrète (secret GCAL_ICS_URL).
// Lecture seule. Renvoie les événements de -30 jours à +180 jours.
import { json, journal, type Env } from "../../../server/db";
import { gcal, gcalActif, type GEnv, type GEvent } from "../../../server/gcal";

type Ev = { uid: string; titre: string; debut: string; fin?: string; journee: boolean; lieu?: string; description?: string; id?: string; recurrent?: boolean };

function deplier(ics: string) { return ics.replace(/\r?\n[ \t]/g, ""); }
function val(l: string) { return l.slice(l.indexOf(":") + 1).replace(/\\n/g, "\n").replace(/\\,/g, ",").replace(/\;/g, ";"); }
function date(l: string): { iso: string; journee: boolean } {
  const v = l.slice(l.indexOf(":") + 1).trim();
  if (/VALUE=DATE[;:]/.test(l) || /^\d{8}$/.test(v)) return { iso: `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`, journee: true };
  const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (!m) return { iso: v, journee: false };
  const base = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`;
  // Z = UTC ; sinon heure locale du club (America/Toronto) — gardée telle quelle, sans fuseau
  return { iso: m[7] ? base + "Z" : base, journee: false };
}

// Récurrences simples (DAILY / WEEKLY avec BYDAY, INTERVAL, COUNT, UNTIL) — suffisant pour entraînements et rencontres
const JOURS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
function repeter(e: Ev, rule: string, ex: string[]): Ev[] {
  const p = Object.fromEntries(rule.split(";").map((x) => x.split("=")));
  const freq = p.FREQ, inter = Number(p.INTERVAL || 1), count = p.COUNT ? Number(p.COUNT) : 400;
  const until = p.UNTIL ? `${p.UNTIL.slice(0, 4)}-${p.UNTIL.slice(4, 6)}-${p.UNTIL.slice(6, 8)}` : "9999";
  if (freq !== "DAILY" && freq !== "WEEKLY") return [{ ...e, titre: e.titre + " (récurrent)" }];
  const d0 = new Date(e.debut.slice(0, 10) + "T12:00:00Z");
  const jours = freq === "WEEKLY" && p.BYDAY ? p.BYDAY.split(",").map((j: string) => JOURS.indexOf(j.slice(-2))) : [d0.getUTCDay()];
  const heure = e.debut.slice(10), heureFin = e.fin?.slice(10) ?? "";
  const dureeJours = e.fin ? Math.round((Date.parse(e.fin.slice(0, 10)) - Date.parse(e.debut.slice(0, 10))) / 864e5) : 0;
  const res: Ev[] = [];
  const limite = new Date(Date.now() + 200 * 864e5);
  for (let i = 0, n = 0; i < 800 && n < count; i++) {
    const d = new Date(d0.getTime() + i * 864e5);
    if (d > limite) break;
    const iso = d.toISOString().slice(0, 10);
    if (iso > until) break;
    const semaines = Math.floor(i / 7);
    const ok = freq === "DAILY" ? i % inter === 0 : jours.includes(d.getUTCDay()) && Math.floor((i + d0.getUTCDay()) / 7) % inter === 0;
    if (!ok) continue;
    void semaines; n++;
    if (ex.includes(iso.replace(/-/g, ""))) continue;
    const fin = e.fin ? new Date(d.getTime() + dureeJours * 864e5).toISOString().slice(0, 10) + heureFin : undefined;
    res.push({ ...e, uid: `${e.uid}-${iso}`, debut: iso + heure, fin });
  }
  return res;
}

type AEnv = Env & GEnv & { GCAL_ICS_URL?: string };

// Lecture via l'API (si le compte de service est configuré) : récurrences développées par Google, événements modifiables
async function viaApi(env: AEnv) {
  const min = new Date(Date.now() - 30 * 864e5).toISOString();
  const max = new Date(Date.now() + 180 * 864e5).toISOString();
  const items: Ev[] = [];
  let page = "";
  for (let i = 0; i < 5; i++) {
    const j = await gcal(env, `/events?singleEvents=true&orderBy=startTime&maxResults=250&timeMin=${encodeURIComponent(min)}&timeMax=${encodeURIComponent(max)}${page ? "&pageToken=" + page : ""}`) as { items: GEvent[]; nextPageToken?: string };
    for (const e of j.items) {
      const journee = !!e.start.date;
      items.push({ uid: e.id, id: e.id, titre: e.summary ?? "(sans titre)", debut: (e.start.date ?? e.start.dateTime)!, fin: e.end.date ?? e.end.dateTime, journee, lieu: e.location, description: e.description?.slice(0, 500), recurrent: !!e.recurringEventId });
    }
    if (!j.nextPageToken) break;
    page = j.nextPageToken;
  }
  return items;
}

export const onRequestGet: PagesFunction<AEnv> = async ({ env }) => {
  let erreurApi = "";
  if (gcalActif(env)) {
    try { return json({ items: await viaApi(env), configure: true, ecriture: true }); }
    catch (e) { erreurApi = (e as Error).message; if (!env.GCAL_ICS_URL) return json({ error: erreurApi }, 502); }
  } else erreurApi = `API non configurée (GCAL_SA_JSON ${env.GCAL_SA_JSON ? "présent" : "absent"}, GCAL_ID ${env.GCAL_ID ? "présent" : "absent"})`;
  if (!env.GCAL_ICS_URL) return json({ items: [], configure: false });
  const r = await fetch(env.GCAL_ICS_URL, { cf: { cacheTtl: 300 } } as RequestInit);
  if (!r.ok) return json({ error: "Agenda Google inaccessible." }, 502);
  const lignes = deplier(await r.text()).split(/\r?\n/);
  const out: Ev[] = [];
  let cur: Partial<Ev> | null = null;
  let rrule = "";
  let exdates: string[] = [];
  for (const l of lignes) {
    if (l === "BEGIN:VEVENT") { cur = {}; rrule = ""; exdates = []; continue; }
    if (l === "END:VEVENT") {
      if (cur?.debut) {
        const base: Ev = { uid: cur.uid ?? crypto.randomUUID(), titre: cur.titre ?? "(sans titre)", debut: cur.debut, fin: cur.fin, journee: !!cur.journee, lieu: cur.lieu, description: cur.description };
        if (!rrule) out.push(base); else out.push(...repeter(base, rrule, exdates));
      }
      cur = null; continue;
    }
    if (!cur) continue;
    if (l.startsWith("SUMMARY")) cur.titre = val(l);
    else if (l.startsWith("DTSTART")) { const d = date(l); cur.debut = d.iso; cur.journee = d.journee; }
    else if (l.startsWith("DTEND")) cur.fin = date(l).iso;
    else if (l.startsWith("LOCATION")) cur.lieu = val(l);
    else if (l.startsWith("DESCRIPTION")) cur.description = val(l).slice(0, 500);
    else if (l.startsWith("UID")) cur.uid = val(l);
    else if (l.startsWith("RRULE")) rrule = val(l);
    else if (l.startsWith("EXDATE")) exdates.push(...l.slice(l.indexOf(":") + 1).split(",").map((x) => x.slice(0, 8)));
  }
  const min = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  const max = new Date(Date.now() + 180 * 864e5).toISOString().slice(0, 10);
  const items = out.filter((e) => e.debut.slice(0, 10) >= min && e.debut.slice(0, 10) <= max).sort((a, b) => a.debut.localeCompare(b.debut));
  return json({ items, configure: true, erreurApi });
};

// Création d'un événement : { titre, date, debut?, fin?, journee, lieu?, description?, chaqueSemaineJusqua? }
export type Corps = { titre?: string; date?: string; debut?: string; fin?: string; journee?: boolean; lieu?: string; description?: string; chaqueSemaineJusqua?: string };
export function corpsGoogle(b: Corps) {
  if (!b.titre?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(b.date ?? "")) throw new Error("Titre et date requis.");
  const tz = "America/Toronto";
  const ev: Record<string, unknown> = { summary: b.titre.trim().slice(0, 200), location: b.lieu?.slice(0, 300) || undefined, description: b.description?.slice(0, 4000) || undefined };
  if (b.journee || !b.debut) {
    const fin = new Date(b.date + "T12:00:00Z"); fin.setUTCDate(fin.getUTCDate() + 1);
    ev.start = { date: b.date }; ev.end = { date: fin.toISOString().slice(0, 10) };
  } else {
    const finH = b.fin && b.fin > b.debut ? b.fin : `${String(Math.min(23, Number(b.debut.slice(0, 2)) + 1)).padStart(2, "0")}${b.debut.slice(2)}`;
    ev.start = { dateTime: `${b.date}T${b.debut}:00`, timeZone: tz }; ev.end = { dateTime: `${b.date}T${finH}:00`, timeZone: tz };
  }
  if (b.chaqueSemaineJusqua && /^\d{4}-\d{2}-\d{2}$/.test(b.chaqueSemaineJusqua)) ev.recurrence = [`RRULE:FREQ=WEEKLY;UNTIL=${b.chaqueSemaineJusqua.replace(/-/g, "")}T235959Z`];
  return ev;
}

export const onRequestPost: PagesFunction<AEnv, string, { email: string }> = async (ctx) => {
  if (!gcalActif(ctx.env)) return json({ error: "La création d’événements n’est pas encore configurée (secrets GCAL_SA_JSON et GCAL_ID)." }, 503);
  try {
    const b = (await ctx.request.json()) as Corps;
    const ev = corpsGoogle(b) as Record<string, unknown>;
    ev.description = [ev.description, `Ajouté depuis l’admin par ${ctx.data.email}`].filter(Boolean).join("\n\n");
    const r = await gcal(ctx.env, "/events", { method: "POST", body: JSON.stringify(ev) }) as GEvent;
    await journal(ctx.env, ctx.data.email, "création", "agenda");
    return json({ item: r }, 201);
  } catch (e) { return json({ error: (e as Error).message }, 400); }
};
