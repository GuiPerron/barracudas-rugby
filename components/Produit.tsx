"use client";
import { useState } from "react";
import type { Article } from "@/data/boutique";
import { RESERVATION } from "@/data/boutique";

/** Fiche produit : galerie devant/dos + réservation (taille, quantité, coordonnées). Envoi vers /api/formulaire. */
export default function Produit({ a }: { a: Article }) {
  const [img, setImg] = useState(0);
  const [coupe, setCoupe] = useState(0);
  const [taille, setTaille] = useState("");
  const c = a.coupes[coupe];
  const stock = c.tailles.find((y) => y.t === taille)?.stock ?? null;
  const max = stock ?? 10;
  const [qte, setQte] = useState(1);
  const [state, setState] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [err, setErr] = useState("");
  const total = a.prix * qte;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!taille) { setErr("Choisissez une taille."); setState("err"); return; }
    setState("sending"); setErr("");
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const r = await fetch("/api/formulaire", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "precommande", article: `${a.nom} · ${a.prix} $`, taille: `${c.nom} ${taille}`, quantite: String(qte), ...data }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Envoi impossible pour le moment.");
      setState("ok");
    } catch (x) { setState("err"); setErr((x as Error).message); }
  }

  return (
    <div className="prod">
      <div className="prod-gal rv">
        <div className="prod-main">
          {a.images.map((im, k) => (
            <img key={im.src} src={`/img/${im.src}-1200.webp`} srcSet={`/img/${im.src}-600.webp 600w, /img/${im.src}-1200.webp 1200w`}
              sizes="(max-width:760px) 100vw, 50vw" alt={im.alt} className={k === img ? "on" : ""} loading={k === 0 ? "eager" : "lazy"} />
          ))}
          <span className="prod-badge">{a.images[img].label}</span>
        </div>
        <div className="prod-thumbs" role="tablist" aria-label="Vues du t-shirt">
          {a.images.map((im, k) => (
            <button key={im.src} role="tab" aria-selected={k === img} className={k === img ? "on" : ""} onClick={() => setImg(k)}>
              <img src={`/img/${im.src}-600.webp`} alt="" /><span>{im.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="prod-info rv">
        <p className="k">{a.campagne ?? "Boutique du club"} · Réservation</p>
        <h2 className="t">{a.nom}</h2>
        <p className="prod-sub">{a.sousTitre}</p>
        {a.accroche && <p className="prod-accroche">{a.accroche} Chaque t-shirt vendu finance la saison du club.</p>}
        <p className="t prod-prix">{a.prix} $</p>
        <ul className="prod-points">{a.points.map((p) => <li key={p}>{p}</li>)}</ul>

        {state === "ok" ? (
          <div className="msg ok" role="status">
            <b>Réservation envoyée !</b><br />{qte} × {a.nom}, {c.nom.toLowerCase()} {taille}, total {total} $.<br />{RESERVATION.confirmation} {RESERVATION.cueillette}
          </div>
        ) : (
          <form className="form prod-form" onSubmit={onSubmit}>
            <fieldset className="prod-sizes">
              <legend>Coupe *</legend>
              <div className="prod-seg">
                {a.coupes.map((x, k) => (
                  <button type="button" key={x.nom} className={k === coupe ? "on" : ""} aria-pressed={k === coupe}
                    onClick={() => { setCoupe(k); setTaille(""); setQte(1); }}>{x.nom}</button>
                ))}
              </div>
            </fieldset>
            <fieldset className="prod-sizes">
              <legend>Taille *</legend>
              <div>
                {c.tailles.map(({ t, stock }) => {
                  const out = stock === 0;
                  return (
                    <button type="button" key={t} disabled={out} title={out ? "Épuisé" : undefined} className={(t === taille ? "on" : "") + (out ? " out" : "")} aria-pressed={t === taille}
                      onClick={() => { setTaille(t); setQte((q) => Math.min(q, stock ?? 10)); if (state === "err") setState("idle"); }}>{t}</button>
                  );
                })}
              </div>
            </fieldset>
            {stock !== null && stock > 0 && stock <= 3 && <p className="prod-stock">Plus que {stock} en {c.nom.toLowerCase()} {taille}</p>}
            <div className="prod-qty">
              <span className="lbl">Quantité</span>
              <div className="stepper">
                <button type="button" aria-label="Moins" onClick={() => setQte(Math.max(1, qte - 1))}>−</button>
                <output aria-live="polite">{qte}</output>
                <button type="button" aria-label="Plus" disabled={qte >= max} onClick={() => setQte(Math.min(max, qte + 1))}>+</button>
              </div>
              <span className="prod-total">Total <b>{total} $</b></span>
            </div>
            <div className="row">
              <label>Nom *<input name="nom" required autoComplete="name" maxLength={120} /></label>
              <label>Courriel *<input name="courriel" type="email" required autoComplete="email" maxLength={160} /></label>
            </div>
            <label>Téléphone<input name="telephone" type="tel" autoComplete="tel" maxLength={40} /></label>
            <label className="hp-field" aria-hidden="true">Ne pas remplir<input name="site_web" tabIndex={-1} autoComplete="off" /></label>
            <label className="consent">
              <input type="checkbox" name="consentement" value="oui" required />
              <span>J’accepte que le club utilise ces renseignements uniquement pour traiter ma réservation.</span>
            </label>
            {state === "err" && <p className="msg err" role="alert">{err}</p>}
            <button className="pill p-navy prod-cta" type="submit" disabled={state === "sending"}>
              {state === "sending" ? "Envoi…" : `Réserver · ${total} $`}
            </button>
            <ul className="prod-assur">
              <li>{RESERVATION.paiement}</li>
              <li>{RESERVATION.cueillette}</li>
            </ul>
          </form>
        )}
      </div>
    </div>
  );
}
