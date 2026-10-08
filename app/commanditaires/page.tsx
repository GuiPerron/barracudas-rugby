import type { Metadata } from "next";
import Page from "@/components/Page";
import Form from "@/components/Form";
import { SectionTitle, Arrow } from "@/components/ui";
import { AUTRES, CHIFFRES, CONTACT_COMMANDITES as C, ETAPES, FINANCE, FORFAITS, INCLUS, INTRO_CLUB, NOTES, POURQUOI, VISIBILITE } from "@/data/commandites";

export const metadata: Metadata = { title: "Commanditaires", description: "Plan de commandite 2027 : forfaits Or, Argent et Bronze, logo sur le maillot avec une entente de 3 ans." };

const prix = (n: number) => n.toLocaleString("fr-CA").replace(/ | /g, " ");

export default function Commanditaires() {
  return (
    <Page surtitre="Saison 2027" titre="Plan de commandite" lead={POURQUOI}>
      <section className="sec">
        <div className="w grid2">
          <div className="rv">
            <SectionTitle>Le club</SectionTitle>
            <div className="prose" style={{ marginTop: 24 }}>{INTRO_CLUB.map((p) => <p key={p.slice(0, 20)}>{p}</p>)}</div>
            <a className="pill p-navy arr" style={{ marginTop: 24 }} href="/docs/Plan-commandite-2027-Barracudas.pdf" download>Télécharger le plan (PDF) <Arrow /></a>
          </div>
          <div className="rv" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignContent: "start" }}>
            {CHIFFRES.map((c) => (
              <div key={c.label} className="stat"><b className="cnt" data-to={c.n}>{c.n}</b><small>{c.label}</small></div>
            ))}
          </div>
        </div>
      </section>

      <section className="sec stand">
        <div className="w">
          <div>
            <SectionTitle>Où votre logo sera vu</SectionTitle>
            <p className="t" style={{ fontSize: 28, color: "var(--skyd)", margin: "18px 0 14px" }}>50 + spectateurs par match à domicile</p>
            <ul className="list">{VISIBILITE.map(([a, b]) => <li key={a}><span><b>{a}</b> : {b}</span></li>)}</ul>
          </div>
          <div>
            <SectionTitle>Ce que votre soutien finance</SectionTitle>
            <ul className="list" style={{ marginTop: 24 }}>{FINANCE.map(([a, b]) => <li key={a}><span><b>{a}</b> : {b}</span></li>)}</ul>
          </div>
        </div>
      </section>

      <section className="sec" id="forfaits">
        <div className="w">
          <SectionTitle>Nos forfaits</SectionTitle>
          <p className="prose" style={{ marginTop: 14 }}>Chaque forfait est annuel. En vous engageant pour 3 ans, votre logo en couleur s’ajoute sur le maillot de match de l’équipe.</p>
          <div className="grid3" style={{ marginTop: 30 }}>
            {FORFAITS.map((f) => (
              <div key={f.nom} className="tier-full rv">
                <p className="k">{f.nom}</p>
                <p className="t price">{prix(f.prix)} $</p>
                <ul>
                  <li>Logo monochrome sur la remorque · zone {f.zone}</li>
                  <li>Logo monochrome sur la bannière · {f.banniere}</li>
                  <li>Logo monochrome sur le t-shirt saison · zone {f.zone}</li>
                  <li>{f.publications}</li>
                </ul>
                <p className="jersey"><b>Entente de 3 ans :</b> {f.maillot}.</p>
              </div>
            ))}
          </div>
          <p className="note">Publication dédiée : un message sur notre page Facebook qui présente votre entreprise. po² : surface du logo en pouces carrés. Tous les forfaits incluent votre logo et un lien sur notre site web.</p>
        </div>
      </section>

      <section className="sec on-navy">
        <div className="w grid2" style={{ alignItems: "center" }}>
          <div className="rv">
            <SectionTitle light>Votre logo sur le maillot</SectionTitle>
            <p style={{ fontSize: 17, lineHeight: 1.65, color: "#C9D7E6", marginTop: 18 }}>Nouveaux maillots de match en 2027. L’emplacement le plus visible : votre logo apparaît sur chaque photo de match, sur nos réseaux sociaux et partout où l’équipe joue. Logo à fournir avant la commande des maillots.</p>
            <div className="grid3" style={{ marginTop: 26 }}>
              {FORFAITS.map((f) => <div key={f.nom}><p className="k" style={{ color: "var(--sky)" }}>{f.nom}</p><p className="t" style={{ fontSize: 22 }}>{f.place}</p></div>)}
            </div>
          </div>
          <div className="rv">
            <div className="jersey-viz">
              <img src="/img/jersey.webp" alt="Illustration du maillot de match, devant et dos" loading="lazy" />
              <span style={{ left: "17.6%", top: "28.5%", width: "13.5%", height: "13%" }}>OR</span>
              <span style={{ left: "68.6%", top: "21%", width: "14.5%", height: "11%" }}>ARGENT</span>
              <span style={{ left: "5.2%", top: "28%", width: "6.4%", height: "9.5%" }}>BRONZE</span>
            </div>
            <p className="note" style={{ color: "#9FB4CB" }}>Illustration générée par IA d’après le chandail actuel, sans logos. Dimensions selon le fabricant.</p>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="w grid2">
          <div className="rv">
            <SectionTitle>Inclus dans chaque partenariat</SectionTitle>
            <ul className="list" style={{ marginTop: 24 }}>{INCLUS.map((x) => <li key={x}><span>{x}</span></li>)}</ul>
          </div>
          <div className="rv" id="autres">
            <SectionTitle>Autres façons de soutenir</SectionTitle>
            <div style={{ display: "grid", gap: 14, marginTop: 24 }}>
              {AUTRES.map(([a, b]) => <div key={a} className="card"><h3>{a}</h3><p style={{ lineHeight: 1.6 }}>{b}</p></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="sec stand" id="demande">
        <div className="w">
          <div className="rv">
            <SectionTitle>Devenons partenaires</SectionTitle>
            <ol className="steps" style={{ marginTop: 26 }}>{ETAPES.map((e) => <li key={e}><span>{e}</span></li>)}</ol>
            <div style={{ marginTop: 26 }}>{NOTES.map((n) => <p key={n} className="note">{n}</p>)}</div>
            <div className="card" style={{ marginTop: 26 }}>
              <h3>{C.nom}</h3>
              <p className="k" style={{ color: "var(--skyd)" }}>{C.role}</p>
              <p style={{ marginTop: 10, lineHeight: 1.8 }}><a href={`tel:${C.telHref}`}>{C.tel}</a><br /><a href="mailto:info@barracudasrugby.com">info@barracudasrugby.com</a></p>
            </div>
          </div>
          <div className="rv">
            <h2 className="t" style={{ fontSize: 30, color: "var(--navy)", marginBottom: 18 }}>Demande de commandite</h2>
            <Form kind="commandite" submit="Envoyer la demande" fields={[
              { type: "text", name: "entreprise", label: "Entreprise", required: true, autoComplete: "organization" },
              { type: "text", name: "nom", label: "Personne-ressource", required: true, autoComplete: "name", half: true },
              { type: "tel", name: "telephone", label: "Téléphone", autoComplete: "tel", half: true },
              { type: "email", name: "courriel", label: "Courriel", required: true, autoComplete: "email" },
              { type: "select", name: "forfait", label: "Forfait souhaité", required: true, options: ["Or · 1 000 $", "Argent · 750 $", "Bronze · 500 $", "Biens et services", "Ami du club", "Sur mesure", "Je ne sais pas encore"] },
              { type: "select", name: "entente", label: "Durée", options: ["1 an", "Entente de 3 ans (logo sur le maillot)"] },
              { type: "textarea", name: "message", label: "Message" },
            ]} />
          </div>
        </div>
      </section>
    </Page>
  );
}
