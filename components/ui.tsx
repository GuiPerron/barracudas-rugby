import { LOGO_PATHS } from "@/lib/logo-paths";
import { CLUBS } from "@/data/saison-2026";

export function Logo({ height, className }: { height?: number; className?: string }) {
  return (
    <svg className={className} style={height ? { height, width: "auto", fill: "var(--sky)", display: "block" } : undefined}
      viewBox="0 0 494 502" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Barracudas">
      {LOGO_PATHS.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

/** Trois traits obliques : marque de section provisoire (la « Vague » est en réserve). */
export function Mark() {
  return (
    <svg className="mark" viewBox="0 0 34 34" aria-hidden="true">
      <path d="M6 26 L16 8 M14 28 L24 10 M22 30 L32 12" stroke="#68CEF6" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

export function SectionTitle({ children, light, as = "h2" }: { children: React.ReactNode; light?: boolean; as?: "h1" | "h2" }) {
  const H = as;
  return (
    <div className="sh">
      <Mark />
      <H className="t sh2d" style={{ color: light ? "#fff" : "var(--navy)" }}>{children}</H>
    </div>
  );
}

export function Crest({ code, size }: { code: string; size: number }) {
  const c = CLUBS[code];
  if (code === "BAR") {
    return (
      <div className="crest us" style={{ width: size, height: size }}>
        <Logo height={Math.round(size * 0.6)} />
      </div>
    );
  }
  return (
    <div className="crest" style={{ width: size, height: size }}>
      {c?.ecusson && <img src={c.ecusson} alt={c.nom} width={size} height={size} loading="lazy" />}
    </div>
  );
}

/** Photo responsive (WebP 960/1920 générés par scripts/images.mjs). */
export function Photo({ name, alt = "", className, pos, sizes = "100vw", eager }: {
  name: string; alt?: string; className?: string; pos?: string; sizes?: string; eager?: boolean;
}) {
  return (
    <img className={className} src={`/img/${name}-1920.webp`}
      srcSet={`/img/${name}-960.webp 960w, /img/${name}-1920.webp 1920w`} sizes={sizes}
      alt={alt} loading={eager ? "eager" : "lazy"} decoding="async"
      style={pos ? { objectPosition: pos } : undefined} />
  );
}

export function Arrow() { return <i aria-hidden="true">→</i>; }

export function IconFacebook() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="#132644" aria-hidden="true"><path d="M14 8h3V4h-3c-2.8 0-4 1.8-4 4v2H8v4h2v8h4v-8h3l1-4h-4V8.5c0-.3.2-.5.5-.5z" /></svg>;
}
export function IconInstagram() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#132644" strokeWidth="2.2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4.2" /><circle cx="17.4" cy="6.6" r="1.2" fill="#132644" stroke="none" /></svg>;
}

/** Met en exposant les ordinaux : « 3e » → 3<sup>e</sup>. */
export function Ordinal({ text }: { text: string }) {
  const parts = text.split(/(\d+e)\b/);
  return <>{parts.map((p, i) => /^\d+e$/.test(p) ? <span key={i}>{p.slice(0, -1)}<sup>e</sup></span> : p)}</>;
}
