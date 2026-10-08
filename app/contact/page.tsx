import type { Metadata } from "next";
import Page from "@/components/Page";
import Form from "@/components/Form";
import { COURRIEL, LIENS } from "@/data/site";

export const metadata: Metadata = { title: "Contact", description: "Joindre le Club de rugby Les Barracudas de Saint-Jean-sur-Richelieu." };

export default function Contact() {
  return (
    <Page surtitre="Nous joindre" titre="Contact" lead="Une question, envie de jouer ou de donner un coup de main ? Écrivez-nous.">
      <section className="sec">
        <div className="w grid2">
          <div className="rv">
            <Form kind="contact" submit="Envoyer" fields={[
              { type: "select", name: "sujet", label: "Sujet", required: true,
                options: ["Information", "Rejoindre le club", "Devenir bénévole", "Commandite", "Ami du club", "Boutique", "Autre"],
                fromQuery: { rejoindre: "Rejoindre le club", benevole: "Devenir bénévole", commandite: "Commandite", ami: "Ami du club", boutique: "Boutique" } },
              { type: "text", name: "nom", label: "Nom", required: true, autoComplete: "name", half: true },
              { type: "email", name: "courriel", label: "Courriel", required: true, autoComplete: "email", half: true },
              { type: "tel", name: "telephone", label: "Téléphone", autoComplete: "tel" },
              { type: "textarea", name: "message", label: "Message", required: true },
            ]} />
          </div>
          <div className="rv">
            <div className="card">
              <h3>Courriel</h3>
              <p><a href={`mailto:${COURRIEL}`} style={{ color: "var(--skyd)", fontWeight: 600 }}>{COURRIEL}</a></p>
            </div>
            <div className="card" style={{ marginTop: 18 }}>
              <h3>Rejoindre l’équipe</h3>
              <p style={{ lineHeight: 1.6 }}>Entraînements dès février, deux pratiques par semaine. L’inscription officielle se fait sur PlayHQ (Rugby Québec).</p>
              <a className="pill p-sky sm" style={{ marginTop: 14 }} href={LIENS.playhq} target="_blank" rel="noopener">Inscription PlayHQ</a>
            </div>
            <div className="card" style={{ marginTop: 18 }}>
              <h3>Réseaux sociaux</h3>
              <p><a href={LIENS.facebook} target="_blank" rel="noopener" style={{ color: "var(--skyd)", fontWeight: 600 }}>Facebook</a>
                {LIENS.instagram && <> · <a href={LIENS.instagram} target="_blank" rel="noopener" style={{ color: "var(--skyd)", fontWeight: 600 }}>Instagram</a></>}</p>
            </div>
          </div>
        </div>
      </section>
    </Page>
  );
}
