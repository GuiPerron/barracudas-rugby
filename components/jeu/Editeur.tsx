"use client";
// Tableau tactique : phases, tracés, consignes par poste, lecture animée et commentaires.
import { useEffect, useMemo, useState } from "react";
import { Terrain } from "./Terrain";
import { Fil, Tiroir, nom, type Comptes } from "@/components/admin/commun";
import { createFormationPhase, replacePhasePlacement, canZoomSetup, setupCamera, formationTemplates, getFormation, type FormationId } from "@/lib/jeu/formations";
import { positions, categories, type Play, type Phase } from "@/lib/jeu/playbook";

export type Jeu = Play & { updatedBy?: string | null };
type Onglet = "poste" | "phase" | "jeu" | "commentaires";
const OUTILS = [
  { id: "move", label: "✋ Déplacer" },
  { id: "run", label: "➜ Course" },
  { id: "pass", label: "⇢ Passe" },
  { id: "kick", label: "⤴ Coup de pied" },
];

export function Editeur({ jeu, onChange, onSave, onBack, onDuplicate, onDelete, editable, busy, dirty, email, comptes, setComptes }: {
  jeu: Jeu; onChange: (p: Jeu) => void; onSave: (p: Jeu) => void; onBack: () => void; onDuplicate: () => void; onDelete: () => void;
  editable: boolean; busy: boolean; dirty: boolean; email: string; comptes: Comptes; setComptes: React.Dispatch<React.SetStateAction<Comptes>>;
}) {
  const [i, setI] = useState(0);
  const [poste, setPoste] = useState(9);
  const [outil, setOutil] = useState("move");
  const [lecture, setLecture] = useState(false);
  const [onglet, setOnglet] = useState<Onglet>("poste");
  const [formOuvert, setFormOuvert] = useState(false);
  const [vue, setVue] = useState<"auto" | "full">("auto");
  const phase = jeu.phases[Math.min(i, jeu.phases.length - 1)];
  const enregistre = /^\d+$/.test(jeu.id);
  const nbCom = comptes[`jeux:${jeu.id}`] ?? 0;

  useEffect(() => {
    if (!lecture) return;
    const t = setTimeout(() => { if (i >= jeu.phases.length - 1) setLecture(false); else setI((n) => n + 1); }, 1800);
    return () => clearTimeout(t);
  }, [lecture, i, jeu.phases.length]);

  const majPhase = (p: Phase) => onChange({ ...jeu, phases: jeu.phases.map((a) => (a.id === phase.id ? p : a)) });
  function choisirPoste(n: number) {
    setPoste(n);
    const p = phase.players.find((p) => p.team === "home" && p.id === n);
    const c = setupCamera(phase.setup);
    if (p && vue === "auto" && (p.x < c.x || p.x > c.x + c.w || p.y < c.y || p.y > c.y + c.h)) setVue("full");
  }
  function ajouterPhase() {
    const copie = { ...structuredClone(phase), id: crypto.randomUUID(), name: `Phase ${jeu.phases.length + 1}`, trails: [] };
    onChange({ ...jeu, phases: [...jeu.phases, copie] });
    setI(jeu.phases.length);
  }
  function retirerPhase() {
    if (!confirm(`Retirer la phase « ${phase.name} » ? Ses placements et consignes seront perdus.`)) return;
    onChange({ ...jeu, phases: jeu.phases.filter((p) => p.id !== phase.id) });
    setI(Math.max(0, i - 1));
  }
  const statut = jeu.example ? "Exemple à adapter" : jeu.status === "published" ? "Publié pour l’équipe" : "Brouillon · pas encore visible par les joueurs";

  return (
    <div className="jeu-editeur">
      <button className="jeu-retour" onClick={onBack}>← Cahier de jeu</button>
      <div className="jeu-titre">
        <div>
          <span className={`jeu-statut ${jeu.example ? "exemple" : jeu.status}`}>{statut}</span>
          <h2>{jeu.title}</h2>
          {jeu.updatedBy && enregistre && !jeu.example && <p className="adm-muted">Modifié par {nom(jeu.updatedBy)}</p>}
        </div>
        {editable && (
          <div className="jeu-actions">
            <button className="adm-btn line sm" onClick={onDuplicate}>Dupliquer</button>
            <button className="adm-btn sm" disabled={busy || !dirty} onClick={() => onSave(jeu)}>{busy ? "Enregistrement…" : "Enregistrer"}</button>
            {jeu.status === "draft" && <button className="adm-btn sm cor" disabled={busy} onClick={() => onSave({ ...jeu, status: "published" })}>Publier pour l’équipe</button>}
          </div>
        )}
      </div>

      <div className="jeu-grille">
        <section className="jeu-tableau">
          <div className="jeu-barre">
            <span className="jeu-tag">{jeu.category}</span>
            <span className="jeu-etat">{dirty ? "● Pas encore enregistré" : jeu.example ? "Exemple à adapter" : "✓ Enregistré"}</span>
          </div>
          <div className="jeu-outils">
            {editable && <button className="adm-btn line sm" onClick={() => { setLecture(false); setFormOuvert(true); }}>Choisir une formation</button>}
            {canZoomSetup(phase.setup) && (
              <select value={vue} onChange={(e) => setVue(e.target.value as "auto" | "full")} aria-label="Vue du terrain">
                <option value="auto">Zoom sur la formation</option>
                <option value="full">Terrain entier</option>
              </select>
            )}
            {editable && (
              <div className="jeu-seg" role="group" aria-label="Outil de dessin">
                {OUTILS.map((t) => (
                  <button key={t.id} aria-pressed={outil === t.id} className={outil === t.id ? "on" : ""} onClick={() => { setLecture(false); setOutil(t.id); }}>{t.label}</button>
                ))}
                <button title="Retirer le dernier tracé" disabled={!phase.trails.length} onClick={() => majPhase({ ...phase, trails: phase.trails.slice(0, -1) })}>↶ Effacer la dernière flèche</button>
              </div>
            )}
          </div>
          <div className="jeu-cadre">
            <Terrain phase={phase} focused={vue === "auto"} editable={editable && !lecture} selected={poste} tool={outil} anime onSelect={choisirPoste} onChange={majPhase} />
          </div>
          <div className="jeu-legende">
            <span><i className="nous" />Barracudas</span><span><i className="eux" />Adversaires</span>
            <span><i className="l-course" />Course</span><span><i className="l-passe" />Passe</span><span><i className="l-pied" />Coup de pied</span>
            <span className="sens">Sens de l’attaque ⟶</span>
          </div>
          <div className="jeu-lecture">
            <button className="adm-btn line sm" aria-label="Première phase" onClick={() => { setI(0); setLecture(false); }}>⏮</button>
            <button className="adm-btn sm" onClick={() => { if (!lecture && i === jeu.phases.length - 1) setI(0); setLecture(!lecture); }}>{lecture ? "❚❚ Pause" : "▶ Lire le jeu"}</button>
            <button className="adm-btn line sm" aria-label="Phase suivante" disabled={i >= jeu.phases.length - 1} onClick={() => { setI((n) => n + 1); setLecture(false); }}>⏭</button>
            <span aria-live="polite">Phase {i + 1} / {jeu.phases.length}</span>
          </div>
          <div className="jeu-phases">
            {jeu.phases.map((p, n) => (
              <button key={p.id} className={n === i ? "on" : ""} onClick={() => { setI(n); setLecture(false); }}>
                <span>{String(n + 1).padStart(2, "0")}</span><strong>{p.name}</strong>
              </button>
            ))}
            {editable && <button className="ajout" disabled={jeu.phases.length >= 20} onClick={ajouterPhase}>+ Ajouter une phase</button>}
          </div>
          {editable && <p className="adm-muted jeu-aide">{outil === "move" ? "✋ Glisse un joueur ou le ballon pour le déplacer." : "✏️ Glisse sur le terrain, du départ à l’arrivée, pour tracer la flèche. Reviens à « Déplacer » pour bouger les joueurs."}</p>}
        </section>

        <aside className="jeu-panneau">
          <div className="jeu-onglets" role="tablist">
            {([["poste", "Par poste"], ["phase", "La phase"], ["jeu", "Le jeu"], ["commentaires", `Commentaires${nbCom ? ` · ${nbCom}` : ""}`]] as const).map(([k, l]) => (
              <button key={k} role="tab" aria-selected={onglet === k} className={onglet === k ? "on" : ""} onClick={() => setOnglet(k)}>{l}</button>
            ))}
          </div>

          {onglet === "poste" && (
            <div className="jeu-contenu">
              <div className="jeu-poste"><span>{poste}</span><div><small>MA MISSION</small><h3>{positions[poste - 1]}</h3></div></div>
              <select value={poste} onChange={(e) => choisirPoste(Number(e.target.value))} aria-label="Choisir un poste">
                {positions.map((p, n) => <option key={n} value={n + 1}>{n + 1} · {p}</option>)}
              </select>
              <p className="jeu-sur">Phase {i + 1} · {phase.name}</p>
              {editable ? (
                <label>Consignes du poste {poste}
                  <textarea rows={8} maxLength={4000} value={phase.roles[String(poste)] || ""} placeholder="Placement, course, timing et soutien attendus…"
                    onChange={(e) => majPhase({ ...phase, roles: { ...phase.roles, [String(poste)]: e.target.value } })} />
                </label>
              ) : <p className="jeu-texte">{phase.roles[String(poste)] || "Pas encore de consigne pour ce poste."}</p>}
              <p className="adm-muted">Touche un joueur bleu sur le terrain pour voir son rôle. Parcours les phases pour suivre l’évolution.</p>
            </div>
          )}

          {onglet === "phase" && (
            <div className="jeu-contenu">
              {editable ? (
                <>
                  <label>Nom de la phase<input maxLength={100} value={phase.name} onChange={(e) => majPhase({ ...phase, name: e.target.value })} /></label>
                  <label>Consigne collective<textarea rows={9} maxLength={6000} value={phase.note} onChange={(e) => majPhase({ ...phase, note: e.target.value })} /></label>
                  <button className="adm-btn line sm danger" disabled={jeu.phases.length === 1} onClick={retirerPhase}>Retirer cette phase</button>
                </>
              ) : (
                <><h3>{phase.name}</h3><p className="jeu-texte">{phase.note || "Aucune consigne collective."}</p></>
              )}
            </div>
          )}

          {onglet === "jeu" && (
            <div className="jeu-contenu">
              {editable ? (
                <>
                  <label>Nom du jeu<input maxLength={120} value={jeu.title} onChange={(e) => onChange({ ...jeu, title: e.target.value })} /></label>
                  <label>Famille de jeu
                    <select value={jeu.category} onChange={(e) => onChange({ ...jeu, category: e.target.value })}>
                      {categories.slice(1).map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </label>
                  <label>Objectif collectif<textarea rows={6} maxLength={2000} value={jeu.summary} onChange={(e) => onChange({ ...jeu, summary: e.target.value })} /></label>
                  <div className="jeu-ligne">
                    {jeu.status === "published" && <button className="adm-btn line sm" disabled={busy} onClick={() => onSave({ ...jeu, status: "draft" })}>Repasser en brouillon</button>}
                    {enregistre && <button className="adm-btn line sm danger" disabled={busy} onClick={onDelete}>Supprimer le jeu</button>}
                  </div>
                </>
              ) : <p className="jeu-texte">{jeu.summary}</p>}
              {jeu.example && <p className="adm-alert info">Exemple pédagogique : à adapter et valider avant de le publier pour l’équipe.</p>}
            </div>
          )}

          {onglet === "commentaires" && (
            <div className="jeu-contenu">
              {enregistre ? <Fil objet="jeux" id={Number(jeu.id)} email={email} setComptes={setComptes} />
                : <p className="adm-muted">Enregistre le jeu une première fois pour pouvoir le commenter.</p>}
            </div>
          )}
        </aside>
      </div>

      {editable && dirty && (
        <div className="jeu-sauver" role="status">
          <span>Tu as des changements pas encore enregistrés.</span>
          <button className="adm-btn" disabled={busy} onClick={() => onSave(jeu)}>{busy ? "Enregistrement…" : "Enregistrer"}</button>
        </div>
      )}

      {formOuvert && (
        <ChoixFormation nbPhases={jeu.phases.length} fermer={() => setFormOuvert(false)} appliquer={(f, mode) => {
          if (mode === "ajout") { onChange({ ...jeu, phases: [...jeu.phases, createFormationPhase(f)] }); setI(jeu.phases.length); }
          else majPhase(replacePhasePlacement(phase, f));
          setVue("auto"); setFormOuvert(false);
        }} />
      )}
    </div>
  );
}

/** Choix d'une formation de départ, avec aperçu. */
export function SelecteurFormation({ value, onChange }: { value: FormationId; onChange: (id: FormationId) => void }) {
  const phase = useMemo(() => createFormationPhase(value), [value]);
  const info = getFormation(value);
  return (
    <div className="jeu-formations">
      <div className="jeu-form-liste" role="radiogroup" aria-label="Formation de départ">
        {formationTemplates.map((t) => (
          <button type="button" role="radio" aria-checked={value === t.id} key={t.id} className={value === t.id ? "on" : ""} onClick={() => onChange(t.id)}>
            <small>{t.group}</small><strong>{t.label}</strong><span>{t.description}</span>
          </button>
        ))}
      </div>
      <div className="jeu-form-apercu">
        <Terrain phase={phase} compact focused />
        <p>{info.note}</p>
        {info.source && <a href={info.source} target="_blank" rel="noreferrer">Repères World Rugby ↗</a>}
      </div>
    </div>
  );
}

function ChoixFormation({ nbPhases, fermer, appliquer }: { nbPhases: number; fermer: () => void; appliquer: (f: FormationId, mode: "ajout" | "remplacer") => void }) {
  const [f, setF] = useState<FormationId>("scrum");
  const [mode, setMode] = useState<"ajout" | "remplacer">(nbPhases >= 20 ? "remplacer" : "ajout");
  return (
    <Tiroir titre="Choisir une formation" fermer={fermer}>
      <div className="adm-form">
        <SelecteurFormation value={f} onChange={setF} />
        <label className="adm-check"><input type="radio" name="mode" checked={mode === "ajout"} disabled={nbPhases >= 20} onChange={() => setMode("ajout")} /> Ajouter comme nouvelle phase</label>
        <label className="adm-check"><input type="radio" name="mode" checked={mode === "remplacer"} onChange={() => setMode("remplacer")} /> Remplacer le placement de la phase actuelle (garde le nom et les consignes)</label>
        <div className="adm-form-actions">
          <button className="adm-btn line" onClick={fermer}>Annuler</button>
          <button className="adm-btn" onClick={() => appliquer(f, mode)}>{mode === "ajout" ? "Ajouter cette formation" : "Appliquer à cette phase"}</button>
        </div>
      </div>
    </Tiroir>
  );
}
