/// <reference types="@cloudflare/workers-types" />
// Modifier (PATCH) ou supprimer (DELETE) un événement Google Agenda. Pour une occurrence d'un événement récurrent,
// « serie: true » agit sur toute la série.
import { json, journal, type Env } from "../../../../server/db";
import { gcal, gcalActif, type GEnv, type GEvent } from "../../../../server/gcal";
import { corpsGoogle, type Corps } from "../agenda";

type AEnv = Env & GEnv;
type Ctx = EventContext<AEnv, string, { email: string }>;

async function cible(ctx: Ctx, serie: boolean) {
  const id = String(ctx.params.id);
  if (!serie) return id;
  const e = await gcal(ctx.env, `/events/${encodeURIComponent(id)}`) as GEvent;
  return e.recurringEventId ?? id;
}

export const onRequestPatch = async (ctx: Ctx) => {
  if (!gcalActif(ctx.env)) return json({ error: "Non configuré." }, 503);
  try {
    const b = await ctx.request.json() as Corps & { serie?: boolean };
    const id = await cible(ctx, !!b.serie);
    const ev = corpsGoogle(b);
    if (b.serie) delete (ev as Record<string, unknown>).start, delete (ev as Record<string, unknown>).end; // la série garde ses dates
    const r = await gcal(ctx.env, `/events/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(ev) });
    await journal(ctx.env, ctx.data.email, "modification", "agenda");
    return json({ item: r });
  } catch (e) { return json({ error: (e as Error).message }, 400); }
};

export const onRequestDelete = async (ctx: Ctx) => {
  if (!gcalActif(ctx.env)) return json({ error: "Non configuré." }, 503);
  try {
    const serie = new URL(ctx.request.url).searchParams.get("serie") === "1";
    const id = await cible(ctx, serie);
    await gcal(ctx.env, `/events/${encodeURIComponent(id)}`, { method: "DELETE" });
    await journal(ctx.env, ctx.data.email, "suppression", "agenda");
    return json({ ok: true });
  } catch (e) { return json({ error: (e as Error).message }, 400); }
};
