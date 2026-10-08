import type { Metadata } from "next";
import Page from "@/components/Page";
import Form from "@/components/Form";
import { SectionTitle } from "@/components/ui";
import { ARTICLES } from "@/data/boutique";

export const metadata: Metadata = { title: "Boutique", description: "Portez les couleurs des Barracudas. Précommande, cueillette à l’entraînement." };

export default function Boutique() {
  return (
    <Page surtitre="Boutique" titre="Portez les couleurs" lead="Portez les couleurs du club, au terrain comme en ville. Précommande en ligne, paiement et cueillette à l’entraînement.">
      <section className="sec">
        <div className="w">
          {ARTICLES.length === 0 ? (
            <div className="empty rv">
              <p className="t">Collection 2027 en préparation</p>
              <p>Les articles seront affichés ici. Pour être avisé, écrivez-nous.</p>
              <a className="pill p-navy sm" style={{ marginTop: 18 }} href="/contact/?sujet=boutique">Nous écrire</a>
            </div>
          ) : (
            <div className="grid2">
              <div>
                <SectionTitle>Articles</SectionTitle>
                <div className="grid2" style={{ marginTop: 26, gap: 18 }}>
                  {ARTICLES.map((a) => (
                    <div key={a.id} className="card rv">
                      {a.img && <img src={a.img} alt={a.nom} style={{ borderRadius: 8, marginBottom: 12 }} />}
                      <h3>{a.nom}</h3><p className="t" style={{ fontSize: 26, color: "var(--skyd)" }}>{a.prix} $</p>
                      {a.tailles && <p className="note">Tailles : {a.tailles.join(", ")}</p>}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="t" style={{ fontSize: 30, color: "var(--navy)", marginBottom: 18 }}>Précommande</h2>
                <Form kind="precommande" submit="Envoyer la précommande" fields={[
                  { type: "select", name: "article", label: "Article", required: true, options: ARTICLES.map((a) => `${a.nom} · ${a.prix} $`) },
                  { type: "text", name: "taille", label: "Taille", half: true },
                  { type: "text", name: "quantite", label: "Quantité", required: true, half: true },
                  { type: "text", name: "nom", label: "Nom", required: true, autoComplete: "name", half: true },
                  { type: "email", name: "courriel", label: "Courriel", required: true, autoComplete: "email", half: true },
                  { type: "textarea", name: "message", label: "Précisions" },
                ]} />
                <p className="note">Aucun paiement en ligne : vous payez à la cueillette, à l’entraînement.</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </Page>
  );
}
