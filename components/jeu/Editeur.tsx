"use client";
// Tableau tactique : phases, tracés, consignes par poste, lecture animée et commentaires.
import { useEffect, useMemo, useRef, useState } from "react";
import { Terrain } from "./Terrain";
import { Fil, Tiroir, nom, type Comptes } from "@/components/admin/commun";
import { createFormationPhase, replacePhasePlacement, formationTemplates, getFormation, type FormationId } from "@/lib/jeu/formations";
import { positions, categories, type Play, type Phase } from "@/lib/jeu/playbook";
import { phaseDepuisSysteme, structureDe, type Systeme } from "@/lib/jeu/systeme";

export type Jeu = Play & { updatedBy?: string | null };
type Onglet = "poste" | "phase" | "jeu" | "commentaires";
const OUTILS = [
  { id: "move", label: "✋ Déplacer" },
  { id: "run", label: "➜ Course" },
  { id: "pass", label: "⇢ Passe" },
  { id: "kick", label: "⤴ Coup de pied" },
  { id: "note", label: "📝 Note" },
];

export function Editeur({ jeu, systemes, onChange, onSave, onBack, onDuplicate, onDelete, editable, busy, dirty, email, comptes, setComptes }: {
  jeu: Jeu; systemes: Systeme[]; onChange: (p: Jeu) => void; onSave: (p: Jeu) => void; onBack: () => void; onDuplicate: () => void; onDelete: () => void;
  editable: boolean; busy: boolean; dirty: boolean; email: string; comptes: Comptes; setComptes: React.Dispatch<React.SetStateAction<Comptes>>;
}) {
  const [i, setI] = useState(0);
  const [poste, setPoste] = useState(9);
  const [outil, setOutil] = useState("move");
  const [lecture, setLecture] = useState(false);
  const [onglet, setOnglet] = useState<Onglet>("poste");
  const [formOuvert, setFormOuvert] = useState(false);
  const phase = jeu.phases[Math.min(i, jeu.phases.length - 1)];
  const enregistre = /^\d+$/.test(jeu.id);
  const nbCom = comptes[`jeux:${jeu.id}`] ?? 0;
  // Historique pour « Annuler » : une copie du jeu avant chaque geste sur le terrain.
  const historique = useRef<string[]>([]);
  const [nbAnnuler, setNbAnnuler] = useState(0);
  const memoriser = () => {
    const etat = JSON.stringify(jeu);
    if (historique.current.at(-1) !== etat) historique.current = [...historique.current.slice(-49), etat];
    setNbAnnuler(historique.current.length);
  };
  function annuler() {
    const actuel = JSON.stringify(jeu);
    let prec = historique.current.pop();
    while (prec === actuel) prec = historique.current.pop();
    setNbAnnuler(historique.current.length);
    if (prec) { const j = JSON.parse(prec) as Jeu; onChange(j); setI((n) => Math.min(n, j.phases.length - 1)); }
  }
  const [lienCopie, setLienCopie] = useState(false);
  async function copierLien() {
    const url = `${location.origin}/admin/#jeu-${jeu.id}`;
    try { await navigator.clipboard.writeText(url); setLienCopie(true); setTimeout(() => setLienCopie(false), 2500); }
    catch { prompt("Copie ce lien :", url); }
  }
  const [aide, setAide] = useState(false);
  useEffect(() => { try { setAide(editable && localStorage.getItem("jeu-aide-terrain") !== "vu"); } catch { /* rien */ } }, [editable]);
  const aideVue = () => { if (aide) { setAide(false); try { localStorage.setItem("jeu-aide-terrain", "vu"); } catch { /* rien */ } } };

  useEffect(() => {
    if (!lecture) return;
    const t = setTimeout(() => { if (i >= jeu.phases.length - 1) setLecture(false); else setI((n) => n + 1); }, 1800);
    return () => clearTimeout(t);
  }, [lecture, i, jeu.phases.length]);

  const majPhase = (p: Phase) => onChange({ ...jeu, phases: jeu.phases.map((a) => (a.id === phase.id ? p : a)) });
  function choisirPoste(n: number) {
    setPoste(n);
    const p = phase.players.find((p) => p.team === "home" && p.id === n);
  }
  /** Étape suivante : copie les positions et fait « jouer » les flèches (coureurs au bout de leur course, ballon au bout de la passe). */
  function ajouterPhase() {
    memoriser();
    const suite = structuredClone(phase);
    const pres = (a: { x: number; y: number }, x: number, y: number) => Math.hypot(a.x - x, a.y - y) < 40;
    for (const t of phase.trails) {
      if (t.type === "run") {
        const j = suite.players.filter((p) => p.team === "home" && pres(p, t.x1, t.y1)).sort((a, b) => Math.hypot(a.x - t.x1, a.y - t.y1) - Math.hypot(b.x - t.x1, b.y - t.y1))[0];
        if (j) {
          if (pres(suite.ball, j.x, j.y)) suite.ball = { x: t.x2 + 12, y: t.y2 + 8 };
          j.x = t.x2; j.y = t.y2;
        }
      } else suite.ball = { x: t.x2, y: t.y2 };
    }
    const copie = { ...suite, id: crypto.randomUUID(), name: `Étape ${i + 2}`, trails: [], notes: [], setup: phase.setup };
    onChange({ ...jeu, phases: [...jeu.phases.slice(0, i + 1), copie, ...jeu.phases.slice(i + 1)] });
    setI(i + 1);
  }
  function noter(pos: { x: number; y: number }, note?: { id: string; texte: string }) {
    const t = prompt(note ? "Modifier la note (laisse vide pour l’effacer) :" : "Texte de la note (ex. « Espace ici ! ») :", note?.texte ?? "");
    if (t === null) return;
    memoriser();
    const notes = phase.notes ?? [];
    const texte = t.trim().slice(0, 80);
    if (note) majPhase({ ...phase, notes: texte ? notes.map((n) => (n.id === note.id ? { ...n, texte } : n)) : notes.filter((n) => n.id !== note.id) });
    else if (texte) majPhase({ ...phase, notes: [...notes, { id: crypto.randomUUID(), ...pos, texte }] });
  }
  function retirerPhase() {
    if (!confirm(`Retirer l’étape « ${phase.name} » ? Ses placements et consignes seront perdus.`)) return;
    memoriser();
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
        <div className="jeu-actions">
          {enregistre && <button className="adm-btn line sm" onClick={copierLien}>{lienCopie ? "✓ Lien copié" : "🔗 Copier le lien"}</button>}
        {editable && (
          <>
            <button className="adm-btn line sm" onClick={onDuplicate}>Dupliquer</button>
            <button className="adm-btn sm" disabled={busy || !dirty} onClick={() => onSave(jeu)}>{busy ? "Enregistrement…" : "Enregistrer"}</button>
            {jeu.status === "draft" && <button className="adm-btn sm cor" disabled={busy} onClick={() => onSave({ ...jeu, status: "published" })}>Publier pour l’équipe</button>}
          </>
        )}
        </div>
      </div>

      <div className="jeu-grille">
        <section className="jeu-tableau">
          <div className="jeu-barre">
            <label className="jeu-nom-etape">
              <span>Étape {i + 1}</span>
              {editable
                ? <input maxLength={100} value={phase.name} aria-label={`Nom de l’étape ${i + 1}`} placeholder="Nomme cette étape (ex. Sortie de mêlée)"
                    onChange={(e) => majPhase({ ...phase, name: e.target.value })} />
                : <strong>{phase.name}</strong>}
            </label>
            <span className="jeu-etat">{dirty ? "● Pas encore enregistré" : jeu.example ? "Exemple à adapter" : "✓ Enregistré"}</span>
          </div>
          <div className="jeu-outils">
            {editable && <button className="adm-btn line sm" onClick={() => { setLecture(false); setFormOuvert(true); }}>Choisir une formation</button>}
            {editable && (
              <div className="jeu-seg" role="group" aria-label="Outil de dessin">
                {OUTILS.map((t) => (
                  <button key={t.id} aria-pressed={outil === t.id} className={outil === t.id ? "on" : ""} onClick={() => { setLecture(false); setOutil(t.id); }}>{t.label}</button>
                ))}
                <button title="Annuler le dernier geste" disabled={!nbAnnuler} onClick={annuler}>↶ Annuler</button>
              </div>
            )}
          </div>
          <div className="jeu-cadre">
            <Terrain phase={phase} editable={editable && !lecture} selected={poste} tool={outil} anime onSelect={choisirPoste} onChange={majPhase}
              onDebut={() => { memoriser(); aideVue(); }} onNote={noter} fantome={!lecture && i > 0 ? jeu.phases[i - 1] : undefined} />
            {aide && !lecture && (
              <div className="jeu-bulle" role="note">
                <strong>Comment déplacer ?</strong> Glisse un joueur bleu ou le ballon avec le doigt ou la souris.
                Pour tracer une flèche, choisis « Course » ou « Passe », puis glisse à partir d’un joueur.
                <button onClick={aideVue}>Compris</button>
              </div>
            )}
          </div>
          <div className="jeu-legende">
            <span><i className="nous" />Barracudas</span><span><i className="eux" />Adversaires</span>
            <span><i className="l-course" />Course</span><span><i className="l-passe" />Passe</span><span><i className="l-pied" />Coup de pied</span>
            <span className="sens">Sens de l’attaque ⟶</span>
          </div>
          <div className="jeu-lecture">
            <button className="adm-btn line sm" aria-label="Première étape" onClick={() => { setI(0); setLecture(false); }}>⏮</button>
            <button className="adm-btn sm" onClick={() => { if (!lecture && i === jeu.phases.length - 1) setI(0); setLecture(!lecture); }}>{lecture ? "❚❚ Pause" : "▶ Lire le jeu"}</button>
            <button className="adm-btn line sm" aria-label="Étape suivante" disabled={i >= jeu.phases.length - 1} onClick={() => { setI((n) => n + 1); setLecture(false); }}>⏭</button>
            <span aria-live="polite">Étape {i + 1} / {jeu.phases.length}</span>
          </div>
          <div className="jeu-etapes-titre">
            <strong>Les étapes du jeu</strong>
            <span>Chaque étape est une image. « ▶ Lire le jeu » fait bouger les joueurs d’une étape à la suivante.</span>
          </div>
          <div className="jeu-phases">
            {jeu.phases.map((p, n) => (
              <div className="jeu-etape" key={p.id}>
                {n > 0 && <span className="jeu-fleche" aria-hidden="true">➜</span>}
                <button className={n === i ? "on" : ""} onClick={() => { setI(n); setLecture(false); }} aria-label={`Étape ${n + 1} : ${p.name}`}>
                  <div className="jeu-vignette"><Terrain phase={p} compact focused /></div>
                  <span>ÉTAPE {n + 1}</span><strong>{p.name}</strong>
                </button>
              </div>
            ))}
            {editable && (
              <div className="jeu-etape">
                <span className="jeu-fleche" aria-hidden="true">➜</span>
                <button className="ajout" disabled={jeu.phases.length >= 20} onClick={ajouterPhase}>
                  <b>+</b>Étape suivante<small>{phase.trails.length ? "Les joueurs suivent tes flèches" : "Copie les positions actuelles"}</small>
                </button>
              </div>
            )}
          </div>
          {editable && (
            <p className="adm-muted jeu-aide">
              {outil === "move" ? "✋ Glisse un joueur ou le ballon pour le déplacer. Une erreur ? « ↶ Annuler »."
                : outil === "note" ? "📝 Touche le terrain pour écrire une note. Touche une note pour la modifier ou l’effacer."
                : "✏️ Pars d’un joueur et glisse jusqu’à l’arrivée. Puis « + Étape suivante » : les joueurs iront au bout de leurs flèches."}
              {i > 0 && " Les cercles pointillés montrent où étaient les joueurs à l’étape d’avant."}
            </p>
          )}
        </section>

        <aside className="jeu-panneau">
          <div className="jeu-onglets" role="tablist">
            {([["poste", "Par poste"], ["phase", "L’étape"], ["jeu", "Le jeu"], ["commentaires", `Commentaires${nbCom ? ` · ${nbCom}` : ""}`]] as const).map(([k, l]) => (
              <button key={k} role="tab" aria-selected={onglet === k} className={onglet === k ? "on" : ""} onClick={() => setOnglet(k)}>{l}</button>
            ))}
          </div>

          {onglet === "poste" && (
            <div className="jeu-contenu">
              <div className="jeu-poste"><span>{poste}</span><div><small>MA MISSION</small><h3>{positions[poste - 1]}</h3></div></div>
              <select value={poste} onChange={(e) => choisirPoste(Number(e.target.value))} aria-label="Choisir un poste">
                {positions.map((p, n) => <option key={n} value={n + 1}>{n + 1} · {p}</option>)}
              </select>
              <p className="jeu-sur">Étape {i + 1} · {phase.name}</p>
              {editable ? (
                <label>Consignes du poste {poste}
                  <textarea rows={8} maxLength={4000} value={phase.roles[String(poste)] || ""} placeholder="Placement, course, timing et soutien attendus…"
                    onChange={(e) => majPhase({ ...phase, roles: { ...phase.roles, [String(poste)]: e.target.value } })} />
                </label>
              ) : <p className="jeu-texte">{phase.roles[String(poste)] || "Pas encore de consigne pour ce poste."}</p>}
              <p className="adm-muted">Touche un joueur bleu sur le terrain pour voir son rôle. Parcours les étapes pour suivre l’évolution.</p>
            </div>
          )}

          {onglet === "phase" && (
            <div className="jeu-contenu">
              {editable ? (
                <>
                  <label>Nom de l’étape<input maxLength={100} value={phase.name} onChange={(e) => majPhase({ ...phase, name: e.target.value })} /></label>
                  <label>Consigne collective<textarea rows={9} maxLength={6000} value={phase.note} onChange={(e) => majPhase({ ...phase, note: e.target.value })} /></label>
                  <button className="adm-btn line sm danger" disabled={jeu.phases.length === 1} onClick={retirerPhase}>Retirer cette étape</button>
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
        <ChoixFormation nbPhases={jeu.phases.length} systemes={systemes} fermer={() => setFormOuvert(false)} appliquer={(f, mode) => {
          memoriser();
          const sys = systemes.find((x) => `sys:${x.id}` === f);
          const nouvelle = sys ? phaseDepuisSysteme(sys) : createFormationPhase(f as FormationId);
          if (mode === "ajout") { onChange({ ...jeu, phases: [...jeu.phases, nouvelle] }); setI(jeu.phases.length); }
          else majPhase(sys ? { ...phase, players: nouvelle.players, ball: nouvelle.ball, trails: [], setup: undefined } : replacePhasePlacement(phase, f as FormationId));
          setFormOuvert(false);
        }} />
      )}
    </div>
  );
}

/** Choix d'une formation de départ, avec aperçu. */
export function SelecteurFormation({ value, onChange }: { value: FormationId | ""; onChange: (id: FormationId) => void }) {
  const valide = formationTemplates.some((t) => t.id === value);
  const phase = useMemo(() => (valide ? createFormationPhase(value as FormationId) : null), [value, valide]);
  const info = valide ? getFormation(value as FormationId) : null;
  return (
    <div className="jeu-formations">
      <div className="jeu-form-liste" role="radiogroup" aria-label="Formation de départ">
        {formationTemplates.map((t) => (
          <button type="button" role="radio" aria-checked={value === t.id} key={t.id} className={value === t.id ? "on" : ""} onClick={() => onChange(t.id)}>
            <small>{t.group}</small><strong>{t.label}</strong><span>{t.description}</span>
          </button>
        ))}
      </div>
      {phase && info && (
        <div className="jeu-form-apercu">
          <Terrain phase={phase} compact focused />
          <p>{info.note}</p>
          {info.source && <a href={info.source} target="_blank" rel="noreferrer">Repères World Rugby ↗</a>}
        </div>
      )}
    </div>
  );
}

function ChoixFormation({ nbPhases, systemes, fermer, appliquer }: { nbPhases: number; systemes: Systeme[]; fermer: () => void; appliquer: (f: string, mode: "ajout" | "remplacer") => void }) {
  const [f, setF] = useState<string>(systemes[0] ? `sys:${systemes[0].id}` : "scrum");
  const [mode, setMode] = useState<"ajout" | "remplacer">(nbPhases >= 20 ? "remplacer" : "ajout");
  const sys = systemes.find((x) => `sys:${x.id}` === f);
  return (
    <Tiroir titre="Choisir une formation" fermer={fermer}>
      <div className="adm-form">
        {systemes.length > 0 && (
          <div className="jeu-form-liste" role="radiogroup" aria-label="Nos systèmes">
            {systemes.map((x) => (
              <button type="button" role="radio" aria-checked={f === `sys:${x.id}`} key={x.id} className={f === `sys:${x.id}` ? "on" : ""} onClick={() => setF(`sys:${x.id}`)}>
                <small>NOTRE SYSTÈME</small><strong>{x.nom}</strong><span>Structure {structureDe(x)} avec une défense alignée</span>
              </button>
            ))}
          </div>
        )}
        {sys ? (
          <div className="jeu-form-apercu"><Terrain phase={phaseDepuisSysteme(sys)} compact /></div>
        ) : null}
        <SelecteurFormation value={sys ? "" : (f as FormationId)} onChange={setF} />
        <label className="adm-check"><input type="radio" name="mode" checked={mode === "ajout"} disabled={nbPhases >= 20} onChange={() => setMode("ajout")} /> Ajouter comme nouvelle étape</label>
        <label className="adm-check"><input type="radio" name="mode" checked={mode === "remplacer"} onChange={() => setMode("remplacer")} /> Remplacer le placement de l’étape actuelle (garde le nom et les consignes)</label>
        <div className="adm-form-actions">
          <button className="adm-btn line" onClick={fermer}>Annuler</button>
          <button className="adm-btn" onClick={() => appliquer(f, mode)}>{mode === "ajout" ? "Ajouter cette formation" : "Appliquer à cette étape"}</button>
        </div>
      </div>
    </Tiroir>
  );
}
