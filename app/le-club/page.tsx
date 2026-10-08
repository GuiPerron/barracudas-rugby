import type { Metadata } from "next";
import Page from "@/components/Page";
import { SectionTitle, Photo, Arrow } from "@/components/ui";
import { CLUB } from "@/data/site";
import { INTRO_CLUB } from "@/data/commandites";

export const metadata: Metadata = { title: "Le club", description: "Le Club de rugby Les Barracudas de Saint-Jean-sur-Richelieu, depuis 1998." };

const GALERIE = ["DB2", "SH53", "DB22", "SH11", "DB6", "DB27", "SH9", "DB23", "DB9", "DB21", "DB25"];

export default function LeClub() {
  return (
    <Page surtitre="Depuis 1998" titre="Le club" lead={CLUB.devise}>
      <section className="sec" id="histoire">
        <div className="w grid2">
          <div className="rv">
            <SectionTitle>Notre histoire</SectionTitle>
            <div className="prose" style={{ marginTop: 24 }}>{INTRO_CLUB.map((p) => <p key={p.slice(0, 20)}>{p}</p>)}</div>
          </div>
          <div className="rv" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignContent: "start" }}>
            {CLUB.chiffres.map((c) => <div key={c.label} className="stat"><b className="cnt" data-to={c.n}>{c.n}</b><small>{c.label}</small></div>)}
          </div>
        </div>
      </section>
      <section className="sec stand" id="equipe">
        <div className="w" style={{ alignItems: "center" }}>
          <div className="rv">
            <SectionTitle>L’équipe 2026</SectionTitle>
            <p className="prose" style={{ marginTop: 20 }}>35 joueurs inscrits en 2026. Demi-finalistes de la poule P3 A de Rugby Québec.</p>
            <a className="pill p-navy arr" style={{ marginTop: 22 }} href="/contact/?sujet=rejoindre">Rejoindre l’équipe <Arrow /></a>
          </div>
          <div className="rv" style={{ position: "relative", height: 380, borderRadius: 14, overflow: "hidden" }}>
            <Photo name="SH53" className="zoom" sizes="(max-width:760px) 100vw, 50vw" alt="L’équipe des Barracudas" />
          </div>
        </div>
      </section>
      <section className="sec" id="ca">
        <div className="w">
          <SectionTitle>Conseil d’administration</SectionTitle>
          <div className="grid3" style={{ marginTop: 26 }}>
            <div className="card rv"><h3>Jean Forget</h3><p className="k" style={{ color: "var(--skyd)" }}>Président</p></div>
            <div className="card rv"><h3>Clément Poncin</h3><p className="k" style={{ color: "var(--skyd)" }}>Vice-président · commandites</p></div>
          </div>
        </div>
      </section>
      <section className="sec club" id="photos">
        <div className="w">
          <SectionTitle>En images</SectionTitle>
          <div className="tiles">
            {GALERIE.map((g) => <div key={g} className="tile rv" style={{ cursor: "default" }}><Photo name={g} sizes="(max-width:760px) 50vw, 25vw" /></div>)}
          </div>
        </div>
      </section>
    </Page>
  );
}
