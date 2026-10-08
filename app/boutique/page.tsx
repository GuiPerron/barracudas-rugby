import type { Metadata } from "next";
import Page from "@/components/Page";
import Produit from "@/components/Produit";
import { SectionTitle } from "@/components/ui";
import { ARTICLES } from "@/data/boutique";

export const metadata: Metadata = { title: "Boutique", description: "T-shirt supporteur officiel des Barracudas, édition 2026, 25 $ : coupes homme, femme et enfant. Réservation en ligne, paiement et cueillette à l’entraînement." };

export default function Boutique() {
  const a = ARTICLES[0];
  return (
    <Page surtitre="Boutique" titre="Portez les couleurs" lead="Réservez en ligne. Paiement et cueillette à l’entraînement, sans paiement en ligne.">
      <section className="sec">
        <div className="w">
          {a ? <Produit a={a} /> : (
            <div className="empty rv"><p className="t">Collection en préparation</p><p>Les articles seront affichés ici.</p></div>
          )}
        </div>
      </section>
      {a?.partenaires && (
        <section className="sec stand" style={{ paddingTop: 70, paddingBottom: 70 }}>
          <div className="w" style={{ display: "block" }}>
            <SectionTitle>Merci à nos partenaires</SectionTitle>
            <p className="prose" style={{ marginTop: 14 }}>Ils sont au dos du t-shirt édition 2026, et à nos côtés toute la saison.</p>
            <ul className="partners-list">{a.partenaires.map((p) => (
              <li key={p.nom} className="rv">{p.url
                ? <a href={p.url} target="_blank" rel="noopener sponsored">{p.nom}<span aria-hidden="true">↗</span></a>
                : <span>{p.nom}</span>}</li>
            ))}</ul>
          </div>
        </section>
      )}
    </Page>
  );
}
