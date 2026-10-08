"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { HERO } from "@/data/site";
import { Photo, Arrow, Ordinal } from "./ui";

const DUREE = 7000;

/** Hero à 3 sujets : fondu + zoom lent (transition CSS, sans saut entre deux images). */
export default function Hero({ children }: { children?: React.ReactNode }) {
  const [i, setI] = useState(-1);      // -1 : rien d'actif avant le premier rendu (déclenche la transition)
  const [entered, setEntered] = useState(-1);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [cycle, setCycle] = useState(0); // relance l'animation de la barre au clic

  const go = useCallback((n: number) => {
    setI(n); setEntered(-1); setCycle((c) => c + 1);
    requestAnimationFrame(() => requestAnimationFrame(() => setEntered(n)));
  }, []);

  useEffect(() => { requestAnimationFrame(() => requestAnimationFrame(() => go(0))); }, [go]);

  useEffect(() => {
    if (i < 0 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => go((i + 1) % HERO.length), DUREE);
    return () => clearTimeout(timer.current);
  }, [i, cycle, go]);

  const cur = Math.max(i, 0);

  return (
    <section className="hero" id="hero" aria-roledescription="carrousel">
      {HERO.map((h, k) => (
        <Photo key={h.img} name={h.img} pos={h.pos} className={"hbg" + (k === i ? " on" : "")} eager={k === 0} />
      ))}
      <div className="w c">
        {HERO.map((h, k) => (
          <div key={k} className={"hs" + (k === cur ? " on" : "") + (k === entered ? " in" : "")} aria-hidden={k !== cur}>
            <p className="k">{h.surtitre}</p>
            {k === 0 ? (
              <h1 className="t ht"><span className="ln"><span>{h.titre[0]}</span></span><span className="ln"><span>{h.titre[1]}</span></span></h1>
            ) : (
              <h2 className="t ht"><span className="ln"><span>{h.titre[0]}</span></span><span className="ln"><span>{h.titre[1]}</span></span></h2>
            )}
            <p className="hp"><Ordinal text={h.texte} /></p>
            <a className="pill p-sky arr" href={h.cta.href} tabIndex={k === cur ? 0 : -1}>{h.cta.label} <Arrow /></a>
          </div>
        ))}
      </div>
      <div className="slides" role="tablist" aria-label="Sujets à la une">
        {HERO.map((h, k) => (
          <button key={k + "-" + (k === i ? cycle : 0)} role="tab" aria-selected={k === i} className={k === i ? "on" : ""} onClick={() => go(k)}>
            <span className="bar"><i></i></span><b>/ {String(k + 1).padStart(2, "0")}</b>{h.onglet}
          </button>
        ))}
      </div>
      {children}
    </section>
  );
}
