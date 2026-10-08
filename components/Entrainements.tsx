import { ENTRAINEMENTS as E, LIENS } from "@/data/site";
import { Arrow } from "./ui";

/** Bloc horaire + terrain des entraînements. variant "band" = bandeau marine pleine largeur, "card" = carte compacte. */
export default function Entrainements({ variant = "band" }: { variant?: "band" | "card" }) {
  const contenu = (
    <>
      <p className="k" style={{ color: variant === "band" ? "var(--sky)" : "var(--skyd)" }}>Entraînements · {E.saison}</p>
      <p style={{ marginTop: 10, fontSize: 15, fontWeight: 600 }}>{E.interieur}</p>
      <p className="k" style={{ marginTop: 18, fontSize: 11, opacity: .85 }}>{E.exterieur}</p>
      {E.seances.map((s) => (
        <p key={s.jour} className="t" style={{ fontSize: variant === "band" ? 40 : 26, lineHeight: 1.05, marginTop: 8 }}>
          {s.jour} <span style={{ color: variant === "band" ? "var(--sky)" : "var(--skyd)" }}>·</span> {s.heure}
        </p>
      ))}
      <p style={{ marginTop: 12, fontSize: 16, lineHeight: 1.55 }}>
        <b>{E.terrain}</b><br />{E.adresse}<br /><span style={{ opacity: .8 }}>{E.secteur}</span>
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
        <a className={"pill arr sm " + (variant === "band" ? "p-sky" : "p-navy")} href={E.carte} target="_blank" rel="noopener">Itinéraire <Arrow /></a>
        <a className="pill p-line sm" href={LIENS.inscription} target="_blank" rel="noopener">S’inscrire sur PlayHQ</a>
      </div>
    </>
  );
  if (variant === "card") return <div className="card" style={{ color: "var(--navy)" }}>{contenu}</div>;
  return (
    <section className="sec on-navy" id="entrainements">
      <div className="w rv">{contenu}</div>
    </section>
  );
}
