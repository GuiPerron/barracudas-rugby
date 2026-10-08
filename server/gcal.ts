/// <reference types="@cloudflare/workers-types" />
// Google Calendar API via un compte de service (secret GCAL_SA_JSON) sur l'agenda GCAL_ID.
export interface GEnv { GCAL_SA_JSON?: string; GCAL_ID?: string }

let jeton: { valeur: string; exp: number } | null = null;
const b64u = (b: ArrayBuffer | Uint8Array | string) => {
  const bytes = typeof b === "string" ? new TextEncoder().encode(b) : new Uint8Array(b as ArrayBuffer);
  let s = ""; bytes.forEach((x) => (s += String.fromCharCode(x)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

async function accessToken(env: GEnv): Promise<string> {
  if (jeton && jeton.exp > Date.now() + 60_000) return jeton.valeur;
  let brut: unknown = JSON.parse(env.GCAL_SA_JSON!.trim());
  if (typeof brut === "string") brut = JSON.parse(brut); // collé entre guillemets
  const sa = brut as { client_email: string; private_key: string; token_uri?: string };
  const pem = sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const now = Math.floor(Date.now() / 1000);
  const aud = sa.token_uri ?? "https://oauth2.googleapis.com/token";
  const unsigned = `${b64u(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64u(JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/calendar.events", aud, iat: now, exp: now + 3600 }))}`;
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const r = await fetch(aud, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${b64u(sig)}` }) });
  const j = (await r.json()) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!j.access_token) throw new Error("Connexion à Google Agenda refusée : " + (j.error_description ?? r.status));
  jeton = { valeur: j.access_token, exp: Date.now() + (j.expires_in ?? 3600) * 1000 };
  return jeton.valeur;
}

export const gcalActif = (env: GEnv) => !!(env.GCAL_SA_JSON && env.GCAL_ID);

export async function gcal(env: GEnv, chemin: string, init: RequestInit = {}) {
  const t = await accessToken(env);
  const r = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(env.GCAL_ID!)}${chemin}`, {
    ...init, headers: { authorization: `Bearer ${t}`, "content-type": "application/json", ...(init.headers ?? {}) },
  });
  if (r.status === 204) return null;
  const j = await r.json() as { error?: { message: string } };
  if (!r.ok) throw new Error("Google Agenda : " + (j.error?.message ?? r.status));
  return j;
}

export type GEvent = { id: string; summary?: string; location?: string; description?: string; start: { date?: string; dateTime?: string }; end: { date?: string; dateTime?: string }; recurringEventId?: string; htmlLink?: string };
