/// <reference types="@cloudflare/workers-types" />
// Vérification du jeton Cloudflare Access (en plus du blocage fait par Access lui-même).
import type { Env } from "./db";

type Jwk = JsonWebKey & { kid: string };
let certs: { at: number; keys: Jwk[] } | null = null;

const b64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=")), (c) => c.charCodeAt(0));

async function cles(team: string): Promise<Jwk[]> {
  if (certs && Date.now() - certs.at < 3600_000) return certs.keys;
  const r = await fetch(`${team}/cdn-cgi/access/certs`);
  const j = (await r.json()) as { keys: Jwk[] };
  certs = { at: Date.now(), keys: j.keys };
  return j.keys;
}

/** Retourne le courriel de l'utilisateur autorisé, ou null. Échoue fermé. */
export async function utilisateur(request: Request, env: Env): Promise<string | null> {
  const autorises = (env.ADMIN_EMAILS ?? "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
  if (env.DEV_EMAIL && new URL(request.url).hostname === "localhost") return env.DEV_EMAIL.toLowerCase();
  const jwt = request.headers.get("cf-access-jwt-assertion");
  if (!jwt || !env.ACCESS_TEAM_DOMAIN) return null;
  const [h, p, s] = jwt.split(".");
  if (!h || !p || !s) return null;
  try {
    const header = JSON.parse(new TextDecoder().decode(b64url(h)));
    const payload = JSON.parse(new TextDecoder().decode(b64url(p)));
    const jwk = (await cles(env.ACCESS_TEAM_DOMAIN)).find((k) => k.kid === header.kid);
    if (!jwk) return null;
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64url(s), new TextEncoder().encode(`${h}.${p}`));
    if (!ok) return null;
    const now = Date.now() / 1000;
    if (payload.exp && payload.exp < now) return null;
    if (payload.iss !== env.ACCESS_TEAM_DOMAIN) return null;
    if (env.ACCESS_AUD && !(Array.isArray(payload.aud) ? payload.aud : [payload.aud]).includes(env.ACCESS_AUD)) return null;
    const email = String(payload.email ?? "").toLowerCase();
    if (!email || (autorises.length && !autorises.includes(email))) return null;
    return email;
  } catch { return null; }
}
