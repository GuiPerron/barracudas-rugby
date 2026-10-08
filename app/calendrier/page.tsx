import type { Metadata } from "next";
import Page from "@/components/Page";
import { SectionTitle, Crest } from "@/components/ui";
import { Standings } from "@/components/home";
import { CLUBS, MATCHS, dateLongue, resultat } from "@/data/saison-2026";
import { LIENS } from "@/data/site";

export const metadata: Metadata = { title: "Calendrier et résultats", description: "Résultats et classement des Barracudas, saison 2026, poule P3 A." };

const nom = (c: string) => CLUBS[c]?.nom ?? c;

export default function Calendrier() {
  return (
    <Page surtitre="Saison 2026 · Poule P3 A" titre="Calendrier et résultats" lead="3e de la poule, 6 victoires, +247 au différentiel. Demi-finale le 8 août 2026.">
      <section className="sec">
        <div className="w">
          <div className="empty rv">
            <p className="t">Saison 2027 : à venir</p>
            <p>Le calendrier sera publié dès que Rugby Québec l’aura confirmé. Entraînements dès février 2027.</p>
          </div>
        </div>
      </section>
      <section className="sec stand" style={{ paddingTop: 70 }}>
        <div className="w">
          <div>
            <SectionTitle>Résultats 2026</SectionTitle>
            <div style={{ marginTop: 30 }}>
              {MATCHS.map((m) => {
                const r = resultat(m);
                return (
                  <div key={m.date} className="tr" style={{ gridTemplateColumns: "1fr auto", padding: "14px 16px" }}>
                    <div>
                      <p className="k" style={{ color: "var(--skyd)" }}>{m.phase} · {dateLongue(m.date)}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                        <Crest code={m.dom} size={34} /><span className="t" style={{ fontSize: 18 }}>{nom(m.dom)}</span>
                        <span className="t" style={{ fontSize: 22, margin: "0 6px" }}>{m.scoreDom}-{m.scoreExt}</span>
                        <span className="t" style={{ fontSize: 18 }}>{nom(m.ext)}</span><Crest code={m.ext} size={34} />
                      </div>
                      {m.lieu && <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>{m.lieu}</p>}
                    </div>
                    <span className={"badge " + r}>{r === "V" ? "Victoire" : "Défaite"}</span>
                  </div>
                );
              })}
            </div>
            <a className="pill p-navy sm" style={{ marginTop: 16 }} href={LIENS.playhq} target="_blank" rel="noopener">Tous les matchs sur PlayHQ</a>
          </div>
          <div id="classement">
            <SectionTitle>Classement</SectionTitle>
            <Standings />
          </div>
        </div>
      </section>
    </Page>
  );
}
