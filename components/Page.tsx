import Header from "./Header";
import Footer from "./Footer";
import Motion from "./Motion";

/** Gabarit des pages intérieures : en-tête plein, bandeau titre, contenu. */
export default function Page({ surtitre, titre, lead, children }: { surtitre: string; titre: string; lead?: string; children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="contenu">
        <section className="phead">
          <div className="w">
            <p className="k">{surtitre}</p>
            <h1 className="t">{titre}</h1>
            {lead && <p className="lead">{lead}</p>}
          </div>
        </section>
        {children}
      </main>
      <Footer />
      <Motion />
    </>
  );
}
