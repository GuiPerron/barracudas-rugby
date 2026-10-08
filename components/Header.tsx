"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { NAV, LIENS } from "@/data/site";
import { Logo, IconFacebook, IconInstagram } from "./ui";
import { PLAYER_ICON } from "@/lib/logo-paths";

export default function Header({ overlay = false }: { overlay?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const path = usePathname();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 60);
    on();
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("open", open);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [open]);

  useEffect(() => setOpen(false), [path]);

  const cls = ["top", overlay ? "" : "solid", scrolled ? "scrolled" : ""].join(" ").trim();

  return (
    <>
      <header className={cls}>
        <div className="w">
          <a href="/" className="brand" aria-label="Accueil Barracudas"><Logo /></a>
          <button className="menu" aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
            <span className="mb"><i></i><i></i><i></i></span>
          </button>
          <nav className="main" aria-label="Menu principal">
            {NAV.map((n, i) => (
              <a key={n.href} href={n.href} className={path?.startsWith(n.href) ? "cur" : ""} style={{ animationDelay: `${0.25 + i * 0.07}s` }}>{n.label}</a>
            ))}
          </nav>
          <div className="socials hide-m">
            <a className="round" href={LIENS.facebook} target="_blank" rel="noopener" aria-label="Facebook"><IconFacebook /></a>
            {LIENS.instagram && <a className="round" href={LIENS.instagram} target="_blank" rel="noopener" aria-label="Instagram"><IconInstagram /></a>}
          </div>
          <a className="pj" href={LIENS.espaceJoueurs}>
            <span><svg width="20" height="20" viewBox="0 0 24 24" fill="#132644" aria-hidden="true"><path d={PLAYER_ICON} /></svg></span>
            Espace joueurs
          </a>
        </div>
      </header>
      <div className="mnav" aria-hidden={!open}>
        <div className="w">
          {NAV.map((n, i) => (
            <a key={n.href} href={n.href} tabIndex={open ? 0 : -1} style={{ transitionDelay: `${80 + i * 60}ms` }}>
              <b>{String(i + 1).padStart(2, "0")}</b>{n.label}
            </a>
          ))}
          <div className="mx" style={{ transitionDelay: "420ms" }}>
            <a href="/contact/?sujet=rejoindre" tabIndex={open ? 0 : -1}>Rejoindre le club</a>
            <a href="/commanditaires/#autres" tabIndex={open ? 0 : -1}>Ami du club</a>
            <a href={LIENS.facebook} tabIndex={open ? 0 : -1}>Facebook</a>
            {LIENS.instagram && <a href={LIENS.instagram} tabIndex={open ? 0 : -1}>Instagram</a>}
          </div>
        </div>
      </div>
    </>
  );
}
