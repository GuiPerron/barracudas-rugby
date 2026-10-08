/// <reference types="@cloudflare/workers-types" />
// Événements de Google Agenda « Barracudas · Club » via l'adresse iCal secrète (secret GCAL_ICS_URL).
// Lecture seule. Renvoie les événements de -30 jours à +180 jours.
import { json, type Env } from "../../../server/db";

type Ev = { uid: string; titre: string; debut: string; fin?: string; journee: boolean; lieu?: string; description?: string };

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

export const onRequestGet: PagesFunction<Env & { GCAL_ICS_URL?: string }> = async ({ env }) => {
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
  return json({ items, configure: true });
};
