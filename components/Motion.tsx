"use client";
import { useEffect } from "react";

/** Apparition au défilement (.rv), traits de section (.mark) et compteurs (.cnt[data-to]). */
export default function Motion() {
  useEffect(() => {
    const R = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const count = (el: HTMLElement) => {
      const to = Number(el.dataset.to);
      const year = to >= 1900 && to < 2100;
      const from = year ? 1900 : 0;
      const fmt = (v: number) => (year ? String(v) : v.toLocaleString("fr-CA"));
      if (R) { el.textContent = fmt(to); return; }
      let st = 0;
      const f = (ts: number) => {
        if (!st) st = ts;
        const p = Math.min(1, (ts - st) / 1400), e = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(Math.round(from + (to - from) * e));
        if (p < 1) requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    };
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target as HTMLElement;
      const sib = el.parentElement ? [...el.parentElement.children].filter((c) => c.classList.contains("rv")) : [];
      el.style.transitionDelay = Math.max(0, sib.indexOf(el)) * 90 + "ms";
      el.classList.add("vis");
      el.querySelectorAll<HTMLElement>(".cnt").forEach(count);
      io.unobserve(el);
    }), { threshold: 0.15 });
    document.querySelectorAll(".rv, .sh .mark").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
