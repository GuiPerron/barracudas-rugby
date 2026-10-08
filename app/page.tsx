import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Motion from "@/components/Motion";
import { MatchBar, Stories, News, Results, Shop, Club, Partners } from "@/components/home";

export default function Accueil() {
  return (
    <>
      <Header overlay />
      <main id="contenu">
        <Hero><MatchBar /></Hero>
        <Stories />
        <News />
        <Results />
        <Shop />
        <Club />
        <Partners />
      </main>
      <Footer />
      <Motion />
    </>
  );
}
