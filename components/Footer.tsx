import { COURRIEL, CREDITS_PHOTO, LIENS } from "@/data/site";
import { Logo } from "./ui";

export default function Footer() {
  return (
    <footer>
      <div className="w">
        <div className="fgrid">
          <div>
            <Logo />
            <p>Club de rugby Les Barracudas<br />de Saint-Jean-sur-Richelieu</p>
          </div>
          <div className="fcol"><b className="k">Le club</b>
            <a href="/le-club/">Le club et l’équipe</a>
            <a href="/calendrier/">Calendrier et résultats</a>
            <a href="/#actualites">Actualités</a>
            <a href="/contact/">Infos / Contact</a>
          </div>
          <div className="fcol"><b className="k">Participer</b>
            <a href={LIENS.inscription} target="_blank" rel="noopener">Rejoindre le club (PlayHQ)</a>
            <a href="/commanditaires/">Commanditaires</a>
            <a href="/boutique/">Boutique</a>
            <a href="/commanditaires/#autres">Ami du club</a>
          </div>
          <div className="fcol"><b className="k">Nous joindre</b>
            <a href={`mailto:${COURRIEL}`}>{COURRIEL}</a>
            <a href={LIENS.facebook} target="_blank" rel="noopener">Facebook</a>
            {LIENS.instagram && <a href={LIENS.instagram} target="_blank" rel="noopener">Instagram</a>}
          </div>
        </div>
        <p className="fcred">{CREDITS_PHOTO} · © {new Date().getFullYear()} Club de rugby Les Barracudas</p>
      </div>
    </footer>
  );
}
