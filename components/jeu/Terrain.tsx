"use client";
// Terrain tactique SVG : joueurs et ballon déplaçables, courses, passes, coups de pied.
// Adapté de l'outil « barracudas-playbook » ; couleurs du club et transitions animées entre les phases.
import { useId, useRef, useState } from "react";
import { setupCamera, canZoomSetup, lineoutNumbers, type FormationId } from "@/lib/jeu/formations";
import type { Phase, Player, Trail } from "@/lib/jeu/playbook";

const C = {
  pelouse: "#132644", ligne: "#DCE8F5", nous: "#68CEF6", nousTxt: "#0E1D35", nousBord: "#B9E9FC",
  eux: "#FF5A3C", euxTxt: "#FFD3C9", course: "#68CEF6", passe: "#FFFFFF", pied: "#FF5A3C",
};

export function Terrain({ phase, compact = false, editable = false, selected = 0, tool = "move", focused = false, anime = false, onSelect, onChange }: {
  phase: Phase; compact?: boolean; editable?: boolean; selected?: number; tool?: string; focused?: boolean; anime?: boolean;
  onSelect?: (n: number) => void; onChange?: (p: Phase) => void;
}) {
  const id = useId().replace(/:/g, "");
  const ref = useRef<SVGSVGElement>(null);
  const drag = useRef<{ kind: string; id?: number; team?: string; x: number; y: number } | null>(null);
  const [glisse, setGlisse] = useState(false);
  const zoomed = focused && canZoomSetup(phase.setup);
  const cam = zoomed ? setupCamera(phase.setup) : setupCamera();
  const rayon = (p: Player) =>
    phase.setup?.startsWith("lineout") && (lineoutNumbers(phase.setup as FormationId).includes(p.id) || p.id === 2 || p.id === 9) ? 4
      : phase.setup?.startsWith("scrum") && p.id <= 9 ? 7 : zoomed ? 7 : 17;
  const point = (e: React.PointerEvent) => {
    const svg = ref.current!; const m = svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const l = pt.matrixTransform(m.inverse());
    return { x: Math.max(25, Math.min(975, l.x)), y: Math.max(25, Math.min(575, l.y)) };
  };
  function down(e: React.PointerEvent, p?: Player) {
    if (p?.team === "home") onSelect?.(p.id);
    if (!editable) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { kind: p ? "player" : tool, id: p?.id, team: p?.team, ...point(e) };
    setGlisse(true);
  }
  function move(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || !editable || !onChange) return;
    const pos = point(e);
    if (d.kind === "player") onChange({ ...phase, players: phase.players.map((p) => (p.id === d.id && p.team === d.team ? { ...p, ...pos } : p)) });
    if (d.kind === "ball") onChange({ ...phase, ball: pos });
  }
  function up(e: React.PointerEvent) {
    const d = drag.current;
    if (d && ["run", "pass", "kick"].includes(d.kind) && onChange) {
      const fin = point(e);
      if (Math.hypot(fin.x - d.x, fin.y - d.y) > (zoomed ? 3 : 15))
        onChange({ ...phase, trails: [...phase.trails, { id: crypto.randomUUID(), x1: d.x, y1: d.y, x2: fin.x, y2: fin.y, type: d.kind as Trail["type"] }] });
    }
    drag.current = null; setGlisse(false);
  }
  const fleche = (couleur: string, nomId: string) => (
    <marker id={`${nomId}${id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9" fill="none" stroke={couleur} strokeWidth="1.5" />
    </marker>
  );
  const trans = anime && !glisse ? "transform .9s cubic-bezier(.45,.05,.25,1)" : "none";
  return (
    <svg ref={ref} viewBox={`${cam.x} ${cam.y} ${cam.w} ${cam.h}`} className={`jeu-terrain${compact ? " compact" : ""}${editable ? " editable" : ""}`}
      role={compact ? "img" : "group"} aria-label="Terrain de rugby, joueurs et déplacements"
      onPointerDown={(e) => down(e)} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { drag.current = null; setGlisse(false); }}>
      <defs>
        <pattern id={`bandes${id}`} width="180" height="600" patternUnits="userSpaceOnUse"><rect width="90" height="600" fill="#fff" opacity=".035" /></pattern>
        {fleche(C.course, "run")}{fleche(C.passe, "pass")}{fleche(C.pied, "kick")}
      </defs>
      <rect width="1000" height="600" fill={C.pelouse} />
      <rect x="50" y="50" width="900" height="500" fill={`url(#bandes${id})`} />
      <g stroke={C.ligne} opacity=".38" strokeWidth="1.3" fill="none">
        <rect x="50" y="50" width="900" height="500" />
        {[100, 276, 500, 724, 900].map((x) => <path key={x} d={`M${x} 50V550`} />)}
        {[140, 420, 580, 860].map((x) => <path key={x} strokeDasharray="9 14" d={`M${x} 50V550`} />)}
        {[87, 157, 443, 513].map((y) => <path key={y} strokeDasharray="11 28" d={`M100 ${y}H900`} />)}
        <path d="M92 267H108M100 267V333M92 333H108M892 267H908M900 267V333M892 333H908" strokeWidth="4" />
      </g>
      <g fill={C.ligne} opacity=".45" fontSize="16" fontFamily="var(--ft), sans-serif" fontWeight="700" textAnchor="middle">
        {[276, 500, 724].map((x, i) => <text key={x} x={x} y="578">{i === 1 ? "50" : "22"}</text>)}
        <text x="75" y="300" transform="rotate(-90 75 300)" fontSize="13" letterSpacing="5">BARRACUDAS</text>
      </g>
      {phase.trails.map((t) => (
        <path key={t.id} d={`M${t.x1} ${t.y1} Q${(t.x1 + t.x2) / 2} ${t.y1} ${t.x2} ${t.y2}`} fill="none"
          stroke={t.type === "run" ? C.course : t.type === "pass" ? C.passe : C.pied} strokeWidth={zoomed ? 1 : 3}
          strokeDasharray={t.type === "pass" ? "7 8" : t.type === "kick" ? "3 6" : undefined} markerEnd={`url(#${t.type}${id})`} />
      ))}
      {phase.players.map((p) => {
        const r = rayon(p); const nous = p.team === "home";
        return (
          <g key={`${p.team}${p.id}`} style={{ transform: `translate(${p.x}px,${p.y}px)`, transition: trans }}
            className={`jeu-joueur${editable ? " draggable" : ""}`}
            onPointerDown={(e) => { e.stopPropagation(); down(e, p); }}
            tabIndex={compact ? -1 : 0} role={compact ? undefined : "button"} aria-label={`${nous ? "Barracudas" : "Adversaire"} numéro ${p.id}`}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && nous) { e.preventDefault(); onSelect?.(p.id); }
              if (editable && onChange && e.key.startsWith("Arrow")) {
                e.preventDefault();
                const pas = zoomed ? 2 : 10;
                const dx = e.key === "ArrowRight" ? pas : e.key === "ArrowLeft" ? -pas : 0;
                const dy = e.key === "ArrowDown" ? pas : e.key === "ArrowUp" ? -pas : 0;
                onChange({ ...phase, players: phase.players.map((a) => a.id === p.id && a.team === p.team ? { ...a, x: Math.max(25, Math.min(975, a.x + dx)), y: Math.max(25, Math.min(575, a.y + dy)) } : a) });
              }
            }}>
            {selected === p.id && nous && <circle r={r + 3} fill="none" stroke="#fff" strokeWidth={zoomed ? 0.5 : 2} strokeDasharray={zoomed ? "1 1" : "3 4"} />}
            <circle r={r} fill={nous ? C.nous : C.eux} fillOpacity={nous ? 1 : 0.32} stroke={nous ? C.nousBord : C.eux} strokeWidth={r < 10 ? 0.6 : 1.5} />
            <text textAnchor="middle" dominantBaseline="central" fontSize={r < 10 ? r * 1.4 : 14} fontWeight="700" fill={nous ? C.nousTxt : C.euxTxt}>{p.id}</text>
          </g>
        );
      })}
      <g style={{ transform: `translate(${phase.ball.x}px,${phase.ball.y}px)`, transition: trans }} className={editable ? "draggable" : ""}
        onPointerDown={(e) => {
          if (editable && tool === "move") { e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); drag.current = { kind: "ball", ...point(e) }; setGlisse(true); }
        }}>
        <g transform={`rotate(-35) scale(${zoomed ? 0.35 : 1})`}>
          <ellipse rx="12" ry="7" fill="#FFF8EC" stroke="#C9B48A" strokeWidth="2" />
          <path d="M-5 0H5M-2-3V3M2-3V3" stroke="#7A6A4A" strokeWidth="1" />
        </g>
      </g>
    </svg>
  );
}
