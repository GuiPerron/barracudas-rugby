"use client";
import { useEffect, useState } from "react";

export type Champ =
  | { type: "text" | "email" | "tel"; name: string; label: string; required?: boolean; autoComplete?: string; half?: boolean }
  | { type: "select"; name: string; label: string; options: string[]; required?: boolean; half?: boolean; fromQuery?: Record<string, string> }
  | { type: "textarea"; name: string; label: string; required?: boolean };

/** Formulaire envoyé à /api/formulaire (fonction Cloudflare Pages). */
export default function Form({ kind, fields, submit, extra }: { kind: "contact" | "commandite" | "precommande"; fields: Champ[]; submit: string; extra?: Record<string, string> }) {
  const [state, setState] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [err, setErr] = useState("");
  const [initial, setInitial] = useState<Record<string, string>>({});

  // Présélection via ?sujet=… (ex. /contact/?sujet=rejoindre)
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const init: Record<string, string> = {};
    fields.forEach((f) => {
      if (f.type === "select" && f.fromQuery) {
        const v = q.get("sujet");
        if (v && f.fromQuery[v]) init[f.name] = f.fromQuery[v];
      }
    });
    setInitial(init);
  }, [fields]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending"); setErr("");
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const r = await fetch("/api/formulaire", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, ...extra, ...data }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Envoi impossible pour le moment.");
      setState("ok"); (e.target as HTMLFormElement).reset();
    } catch (x) {
      setState("err"); setErr((x as Error).message);
    }
  }

  if (state === "ok") return <p className="msg ok" role="status">Merci ! Votre message a bien été envoyé. Nous vous répondrons rapidement.</p>;

  const rows: React.ReactNode[] = [];
  for (let k = 0; k < fields.length; k++) {
    const f = fields[k], n = fields[k + 1];
    const el = (c: Champ) => <Field key={c.name} f={c} value={initial[c.name]} />;
    if ("half" in f && f.half && n && "half" in n && n.half) { rows.push(<div className="row" key={f.name}>{el(f)}{el(n)}</div>); k++; }
    else rows.push(el(f));
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate={false}>
      {rows}
      <label className="hp-field" aria-hidden="true">Ne pas remplir<input name="site_web" tabIndex={-1} autoComplete="off" /></label>
      <label className="consent">
        <input type="checkbox" name="consentement" value="oui" required />
        <span>J’accepte que le Club de rugby Les Barracudas utilise ces renseignements uniquement pour répondre à ma demande. Ils ne sont ni vendus ni partagés.</span>
      </label>
      {state === "err" && <p className="msg err" role="alert">{err} Écrivez-nous à info@barracudasrugby.com.</p>}
      <div><button className="pill p-navy" type="submit" disabled={state === "sending"}>{state === "sending" ? "Envoi…" : submit}</button></div>
    </form>
  );
}

function Field({ f, value }: { f: Champ; value?: string }) {
  const req = "required" in f && f.required;
  const lab = <>{f.label}{req ? " *" : ""}</>;
  if (f.type === "textarea") return <label>{lab}<textarea name={f.name} required={req} maxLength={4000} /></label>;
  if (f.type === "select")
    return (
      <label>{lab}
        <select name={f.name} required={req} key={value} defaultValue={value ?? ""}>
          <option value="" disabled>Choisir…</option>
          {f.options.map((o) => <option key={o}>{o}</option>)}
        </select>
      </label>
    );
  return <label>{lab}<input type={f.type} name={f.name} required={req} autoComplete={f.autoComplete} maxLength={200} /></label>;
}
