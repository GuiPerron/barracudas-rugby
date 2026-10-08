import { ACTUALITES, CLUB, STORIES } from "@/data/site";
import { CLASSEMENT, CLUBS, MATCHS, POULE, SOURCE, dateCourte, dateLongue, jourMois, resultat } from "@/data/saison-2026";
import { FORFAITS } from "@/data/commandites";
import { Arrow, Crest, Photo, SectionTitle } from "./ui";

const nom = (c: string) => CLUBS[c]?.nom ?? c;
const prix = (n: number) => n.toLocaleString("fr-CA").replace(/ | /g, " ");

export function MatchBar() {
  const trois = MATCHS.slice(0, 3).reverse();
  return (
    <div className="matchbar">
      <div className="mb1">
        <p className="k">Saison 2026 · Ligue P3 A</p>
        <p className="t">Demi-finalistes</p>
        <p className="s">3<sup>e</sup> de la poule · 6 victoires · +247 au différentiel</p>
        <p className="k" style={{ marginTop: 12, fontSize: 11 }}>Reprise : entraînements intérieurs en février 2027</p>
      </div>
      <div className="mbs">
        {trois.map((m) => {
          const r = resultat(m);
          return (
            <a key={m.date} href="/calendrier/">
              <p className="k">{m.phase} · {dateCourte(m.date)}</p>
              <div className="vs">
                <Crest code={m.dom} size={52} />
                <span className="t score">{m.scoreDom}<span style={{ color: "var(--sky)" }}> - </span>{m.scoreExt}</span>
                <Crest code={m.ext} size={52} />
              </div>
              <small>{nom(m.dom)} vs {nom(m.ext)}</small>
              <span className={"badge " + r}>{r === "V" ? "Victoire" : r === "D" ? "Défaite" : "Nul"}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

export function Stories() {
  return (
    <div className="w stories">
      {STORIES.map((s) => (
        <a key={s.label} className="story rv" href={s.href}>
          <div><Photo name={s.img} sizes="150px" /><p>{s.label}</p></div>
        </a>
      ))}
    </div>
  );
}

export function News() {
  const [une, ...autres] = ACTUALITES;
  return (
    <section className="sec" id="actualites">
      <div className="w">
        <div className="shead rv"><SectionTitle>Actualités</SectionTitle></div>
        <div className="news">
          <a className="feat rv" href="/calendrier/">
            <Photo name={une.img} className="zoom" sizes="(max-width:760px) 100vw, 40vw" />
            <div className="box">
              <p className="k">{une.tag} · {une.date}</p>
              <p className="t">{une.titre}</p>
              <span className="pill p-sky arr sm">Voir les résultats <Arrow /></span>
            </div>
          </a>
          <div className="ncards">
            {autres.map((a) => (
              <a key={a.titre} className="ncard rv" href={a.href ?? "/calendrier/"}>
                <div className="im"><Photo name={a.img} className="zoom" sizes="(max-width:760px) 100vw, 30vw" /><span className="tag">{a.tag}</span></div>
                <div className="txt"><p className="t">{a.titre}</p><small>{a.date}</small></div>
              </a>
            ))}
          </div>
          <div className="briefs rv">
            <p className="k">Résultats 2026</p>
            {MATCHS.slice(0, 6).map((m) => {
              const { jour, mois } = jourMois(m.date);
              return (
                <a key={m.date} className="brief" href="/calendrier/">
                  <div className="d"><b>{jour}</b><small>{mois.replace(".", "")}</small></div>
                  <p>{m.phase === "Demi-finale" ? "Demi-finale : " : ""}{nom(m.dom)} {m.scoreDom}-{m.scoreExt} {nom(m.ext)}</p>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Results() {
  const finale = MATCHS[0];
  const saison = MATCHS.filter((m) => m.phase === "Saison").slice(0, 4).reverse();
  return (
    <section className="sec stand">
      <div className="w">
        <div>
          <div className="shead"><SectionTitle>Résultats</SectionTitle><a className="pill p-sky sm" href="/calendrier/">Tous les résultats</a></div>
          <div className="mc">
            <div className="ghost"><p className="k">{dateCourte(MATCHS[1].date)}</p><p className="t" style={{ fontSize: 26 }}>{MATCHS[1].scoreDom} - {MATCHS[1].scoreExt}</p><p>vs {nom(MATCHS[1].ext)}</p></div>
            <div className="mcard rv">
              <p className="k">{finale.phase} P3 A · {dateLongue(finale.date)}</p>
              <div className="vs"><Crest code={finale.dom} size={64} /><p className="t score">{finale.scoreDom} <span style={{ color: "var(--skyd)" }}>-</span> {finale.scoreExt}</p><Crest code={finale.ext} size={64} /></div>
              <p className="t" style={{ fontSize: 18 }}>{nom(finale.dom)} vs {nom(finale.ext)}</p>
              {finale.lieu && <small>{finale.lieu}</small>}
            </div>
            <div className="ghost"><p className="k">Saison 2027</p><p className="t" style={{ fontSize: 22 }}>À venir</p></div>
          </div>
          <div style={{ marginTop: 22 }}>
            {saison.map((m) => {
              const r = resultat(m);
              return (
                <div key={m.date} className="tr res">
                  <span className="k">{dateCourte(m.date)}</span>
                  <span className="t" style={{ fontSize: 17 }}>{nom(m.dom)} vs {nom(m.ext)}</span>
                  <span className="t r" style={{ fontSize: 18 }}>{m.scoreDom}-{m.scoreExt}</span>
                  <span className={"k r " + r} aria-label={r === "V" ? "Victoire" : "Défaite"}>{r}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <div className="shead"><SectionTitle>Classement</SectionTitle><a className="pill p-sky sm" href="/calendrier/#classement">Classement complet</a></div>
          <Standings />
        </div>
      </div>
    </section>
  );
}

export function Standings() {
  return (
    <div style={{ marginTop: 30 }} role="table" aria-label={`Classement ${POULE}`}>
      <div className="tr cl head" role="row">
        <span></span><span></span><span className="k">{POULE}</span>
        <span className="k c">J</span><span className="k c">V</span><span className="k c">D</span><span className="k r">Diff.</span><span className="k r">Pts</span>
      </div>
      {CLASSEMENT.map((l) => (
        <div key={l.club} role="row" className={"tr cl" + (l.club === "BAR" ? " us rv sweep" : "")}>
          <span className="n">{l.rang}</span>
          <Crest code={l.club} size={32} />
          <span className="t" style={{ fontSize: 18 }}>{nom(l.club)}</span>
          <span className="c">{l.j}</span><span className="c">{l.v}</span><span className="c">{l.d}</span>
          <span className="r">{l.diff > 0 ? "+" : ""}{l.diff}</span>
          <span className="t r" style={{ fontSize: 20 }}>{l.pts}</span>
        </div>
      ))}
      <p className="src">{SOURCE}</p>
    </div>
  );
}

export function Shop() {
  return (
    <section className="sec on-navy">
      <div className="w shop">
        <div className="rv">
          <SectionTitle light>La boutique</SectionTitle>
          <p className="lead">Le t-shirt supporteur officiel, avec nos partenaires au dos. Réservez-le en ligne, payez à la cueillette.</p>
          <p className="t" style={{ fontSize: 44, color: "var(--sky)", marginBottom: 22 }}>25 $</p>
          <a className="pill p-sky arr" href="/boutique/">Réserver mon t-shirt <Arrow /></a>
        </div>
        <a className="shop-prod rv" href="/boutique/" aria-label="T-shirt supporteur officiel">
          <img src="/img/tshirt-devant-1200.webp" srcSet="/img/tshirt-devant-600.webp 600w, /img/tshirt-devant-1200.webp 1200w" sizes="(max-width:760px) 90vw, 40vw" alt="T-shirt supporteur officiel des Barracudas" loading="lazy" />
          <span className="prod-badge">T-shirt supporteur</span>
        </a>
      </div>
    </section>
  );
}

export function Club() {
  return (
    <section className="sec club">
      <div className="w">
        <SectionTitle>Les Barracudas depuis 1998</SectionTitle>
        <div className="stats">
          <p className="t quote">{CLUB.devise}</p>
          {CLUB.chiffres.map((c) => (
            <div key={c.label} className="stat rv"><b className="cnt" data-to={c.n}>{c.n}</b><small>{c.label}</small></div>
          ))}
        </div>
        <div className="tiles">
          {CLUB.tuiles.map((t) => (
            <a key={t.label} className="tile rv" href={t.href}><Photo name={t.img} sizes="(max-width:760px) 50vw, 25vw" /><p>{t.label}</p></a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Partners() {
  return (
    <section className="sec on-navy">
      <div className="w">
        <div className="shead rv">
          <SectionTitle light>Devenez partenaire</SectionTitle>
          <a className="pill p-cor arr" href="/commanditaires/#demande">Demander le plan de commandite <Arrow /></a>
        </div>
        <div className="tiers">
          {FORFAITS.map((f) => (
            <a key={f.nom} className="tierc rv" href="/commanditaires/#forfaits">
              <p className="k">{f.nom}</p>
              <p className="t price"><span className="cnt" data-to={f.prix}>{prix(f.prix)}</span> $</p>
              <p className="d">par saison · {f.court}</p>
              <div className="plogo">Votre logo ici</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
