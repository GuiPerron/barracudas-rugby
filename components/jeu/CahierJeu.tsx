"use client";
// Cahier de jeu des Barracudas : bibliothèque, tableau tactique, système de jeu et membres.
// Données : /api/admin/jeu (D1). Rôles : éditeur (crée, modifie, publie) ou lecteur.
import { useCallback, useEffect, useState } from "react";
import { api, nom, Bulle, Tiroir, type Comptes } from "@/components/admin/commun";
import { Terrain } from "./Terrain";
import { Editeur, SelecteurFormation, type Jeu } from "./Editeur";
import { createFormationPhase, getFormation, type FormationId } from "@/lib/jeu/formations";
import { categories, positions, type Principle } from "@/lib/jeu/playbook";

type Membre = { email: string; nom: string; role: "editeur" | "lecteur"; poste: number };
type Etat = { moi: { email: string; ca: boolean; role: "editeur" | "lecteur" | null }; jeux: Jeu[]; principes: Principle[]; versionSysteme: number; membres: Membre[] };
type Vue = "biblio" | "editeur" | "systeme" | "membres";

export default function CahierJeu({ comptes, setComptes }: { comptes: Comptes; setComptes: React.Dispatch<React.SetStateAction<Comptes>> }) {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [erreur, setErreur] = useState("");
  const [vue, setVue] = useState<Vue>("biblio");
  const [brouillon, setBrouillon] = useState<Jeu | null>(null);
  const [modifie, setModifie] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const [filtre, setFiltre] = useState("Tous les jeux");
  const [creer, setCreer] = useState(false);
  const [vueJoueur, setVueJoueur] = useState(false);
  const [message, setMessage] = useState("");

  const charger = useCallback(async () => {
    try { setEtat(await api<Etat>("/api/admin/jeu")); setErreur(""); }
    catch (e) { setErreur((e as Error).message); }
  }, []);
  useEffect(() => { charger(); }, [charger]);
  useEffect(() => {
    if (!modifie) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    addEventListener("beforeunload", h); return () => removeEventListener("beforeunload", h);
  }, [modifie]);
  useEffect(() => { if (!message) return; const t = setTimeout(() => setMessage(""), 3500); return () => clearTimeout(t); }, [message]);

  if (erreur) return <p className="adm-alert">{erreur}</p>;
  if (!etat) return <p className="adm-muted">Chargement du cahier de jeu…</p>;

  const editeur = etat.moi.role === "editeur" && !vueJoueur;
  const jeux = etat.jeux.filter((j) => !vueJoueur || j.status === "published");
  const visibles = jeux.filter((j) => filtre === "Tous les jeux" || j.category === filtre);

  const garde = (fn: () => void) => { if (!modifie || confirm("Des modifications ne sont pas enregistrées. Quitter sans les conserver ?")) { setModifie(false); fn(); } };
  const ouvrir = (j: Jeu) => garde(() => { setBrouillon(structuredClone(j)); setVue("editeur"); });

  async function enregistrer(j: Jeu) {
    setOccupe(true);
    try {
      const nouveau = !/^\d+$/.test(j.id);
      const r = nouveau
        ? await api<{ jeu: Jeu }>("/api/admin/jeu", { method: "POST", body: JSON.stringify({ jeu: j }) })
        : await api<{ jeu: Jeu }>(`/api/admin/jeu/${j.id}`, { method: "PUT", body: JSON.stringify({ jeu: j, version: j.version }) });
      setBrouillon(structuredClone(r.jeu)); setModifie(false);
      setEtat((e) => e && { ...e, jeux: [r.jeu, ...e.jeux.filter((x) => x.id !== r.jeu.id)] });
      setMessage(r.jeu.status === "published" && j.status === "published" ? "Jeu publié pour l’équipe." : "Modifications enregistrées.");
    } catch (e) { alert((e as Error).message); }
    setOccupe(false);
  }
  async function supprimer(j: Jeu) {
    if (!confirm(`Supprimer définitivement « ${j.title} » et ses commentaires ?`)) return;
    setOccupe(true);
    try {
      await api(`/api/admin/jeu/${j.id}`, { method: "DELETE" });
      setEtat((e) => e && { ...e, jeux: e.jeux.filter((x) => x.id !== j.id) });
      setModifie(false); setVue("biblio"); setMessage("Jeu supprimé.");
    } catch (e) { alert((e as Error).message); }
    setOccupe(false);
  }
  function dupliquer() {
    if (!brouillon) return;
    garde(() => { setBrouillon({ ...structuredClone(brouillon), id: crypto.randomUUID(), title: `${brouillon.title} · copie`, status: "draft", example: false, version: 0 }); setModifie(true); });
  }

  return (
    <div className="jeu">
      <div className="jeu-entete">
        <nav className="jeu-sousnav" aria-label="Cahier de jeu">
          {([["biblio", "Bibliothèque"], ["systeme", "Système de jeu"], ...(etat.moi.role === "editeur" && !vueJoueur ? [["membres", "Membres"]] : [])] as [Vue, string][]).map(([k, l]) => (
            <button key={k} className={vue === k || (k === "biblio" && vue === "editeur") ? "on" : ""} onClick={() => garde(() => setVue(k))}>{l}</button>
          ))}
        </nav>
        {etat.moi.role === "editeur" && (
          <button className={`adm-btn line sm${vueJoueur ? " on" : ""}`} onClick={() => garde(() => { setVueJoueur(!vueJoueur); setVue("biblio"); })}>
            {vueJoueur ? "← Revenir à mon cahier" : "👀 Voir comme un joueur"}
          </button>
        )}
      </div>
      {vueJoueur && <p className="adm-alert info">Tu vois le cahier comme un joueur : seulement les jeux publiés, sans modification.</p>}
      {message && <p className="jeu-toast" role="status">{message}</p>}

      {vue === "biblio" && (
        <>
          <div className="adm-bar-top">
            <div>
              <h1>Cahier de jeu</h1>
              <p className="adm-muted">Nos lancements, nos repères, notre rugby. {jeux.length} jeu{jeux.length > 1 ? "x" : ""}.</p>
            </div>
            {editeur && <button className="adm-btn" onClick={() => setCreer(true)}>+ Créer un jeu</button>}
          </div>
          {editeur && <Guide />}
          <div className="jeu-filtres" role="group" aria-label="Filtrer les jeux">
            {categories.map((c) => <button key={c} aria-pressed={filtre === c} className={filtre === c ? "on" : ""} onClick={() => setFiltre(c)}>{c}</button>)}
          </div>
          {visibles.length === 0 ? (
            <div className="adm-empty">{jeux.length ? "Aucun jeu dans cette catégorie." : editeur ? "Crée un premier jeu pour commencer." : "Les jeux publiés apparaîtront ici."}</div>
          ) : (
            <div className="jeu-cartes">
              {visibles.map((j) => (
                <button className="jeu-carte" key={j.id} onClick={() => ouvrir(j)}>
                  <div className="jeu-mini"><Terrain phase={j.phases[0]} compact focused /><span>{j.category}</span></div>
                  <div className="jeu-carte-info">
                    <h3>{j.title}</h3>
                    <p>{j.phases.length} phase{j.phases.length > 1 ? "s" : ""}{j.updatedBy && !j.example ? ` · ${nom(j.updatedBy)}` : ""}</p>
                    <div>
                      <span className={`jeu-statut ${j.example ? "exemple" : j.status}`}>{j.example ? "Exemple" : j.status === "draft" ? "Brouillon" : "Publié"}</span>
                      <Bulle n={comptes[`jeux:${j.id}`]} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {vue === "editeur" && brouillon && (
        <Editeur key={brouillon.id} jeu={brouillon} editable={editeur} busy={occupe} dirty={modifie} email={etat.moi.email} comptes={comptes} setComptes={setComptes}
          onChange={(j) => { setBrouillon(j); setModifie(true); }} onSave={enregistrer} onBack={() => garde(() => setVue("biblio"))}
          onDuplicate={dupliquer} onDelete={() => supprimer(brouillon)} />
      )}

      {vue === "systeme" && <Systeme etat={etat} editable={editeur} setEtat={setEtat} setModifie={setModifie} modifie={modifie} setMessage={setMessage} />}
      {vue === "membres" && editeur && <Membres etat={etat} recharger={charger} />}

      {creer && (
        <CreerJeu fermer={() => setCreer(false)} creer={(titre, cat, f) => {
          const info = getFormation(f);
          setBrouillon({ id: crypto.randomUUID(), title: titre.trim() || info.label, category: cat, format: "XV", status: "draft", summary: info.description, phases: [createFormationPhase(f)], updatedAt: new Date().toISOString(), version: 0 });
          setModifie(true); setCreer(false); setVue("editeur");
        }} />
      )}
    </div>
  );
}

function CreerJeu({ fermer, creer }: { fermer: () => void; creer: (titre: string, cat: string, f: FormationId) => void }) {
  const [f, setF] = useState<FormationId>("scrum");
  const [titre, setTitre] = useState("");
  const [cat, setCat] = useState("Conquête");
  return (
    <Tiroir titre="Créer un jeu" fermer={fermer}>
      <form className="adm-form" onSubmit={(e) => { e.preventDefault(); creer(titre, cat, f); }}>
        <p className="adm-muted">Choisis un placement de départ, puis ajuste les joueurs, les phases et les consignes dans le tableau.</p>
        <SelecteurFormation value={f} onChange={(id) => { setF(id); setCat(getFormation(id).category); }} />
        <label>Nom du jeu<input maxLength={120} value={titre} onChange={(e) => setTitre(e.target.value)} placeholder={getFormation(f).label} /></label>
        <label>Famille de jeu<select value={cat} onChange={(e) => setCat(e.target.value)}>{categories.slice(1).map((c) => <option key={c}>{c}</option>)}</select></label>
        <p className="adm-muted">Rugby à XV · 15 joueurs · commence en brouillon</p>
        <div className="adm-form-actions">
          <button type="button" className="adm-btn line" onClick={fermer}>Annuler</button>
          <button className="adm-btn">Ouvrir le tableau tactique</button>
        </div>
      </form>
    </Tiroir>
  );
}

function Systeme({ etat, editable, setEtat, modifie, setModifie, setMessage }: {
  etat: Etat; editable: boolean; setEtat: React.Dispatch<React.SetStateAction<Etat | null>>; modifie: boolean; setModifie: (b: boolean) => void; setMessage: (m: string) => void;
}) {
  const [p, setP] = useState<Principle[]>(etat.principes);
  const [occupe, setOccupe] = useState(false);
  const maj = (id: string, champ: "title" | "text", v: string) => { setP((x) => x.map((a) => (a.id === id ? { ...a, [champ]: v } : a))); setModifie(true); };
  async function enregistrer() {
    setOccupe(true);
    try {
      const r = await api<{ principes: Principle[]; version: number }>("/api/admin/jeu/systeme", { method: "PUT", body: JSON.stringify({ principes: p, version: etat.versionSysteme }) });
      setEtat((e) => e && { ...e, principes: r.principes, versionSysteme: r.version }); setModifie(false); setMessage("Système de jeu enregistré.");
    } catch (e) { alert((e as Error).message); }
    setOccupe(false);
  }
  return (
    <>
      <div className="adm-bar-top">
        <div><h1>Système de jeu</h1><p className="adm-muted">Les principes qui relient tous nos jeux.</p></div>
        {editable && (
          <div className="jeu-ligne">
            <button className="adm-btn line sm" disabled={p.length >= 20} onClick={() => { setP([...p, { id: crypto.randomUUID(), title: "Nouveau principe", text: "" }]); setModifie(true); }}>+ Principe</button>
            <button className="adm-btn" disabled={occupe || !modifie} onClick={enregistrer}>{occupe ? "Enregistrement…" : "Enregistrer"}</button>
          </div>
        )}
      </div>
      <div className="jeu-principes">
        {p.map((x, n) => (
          <section key={x.id} className="adm-card jeu-principe">
            <span className="jeu-num">{String(n + 1).padStart(2, "0")}</span>
            {editable ? (
              <>
                <input aria-label={`Titre du principe ${n + 1}`} maxLength={120} value={x.title} onChange={(e) => maj(x.id, "title", e.target.value)} />
                <textarea aria-label={`Description du principe ${n + 1}`} rows={5} maxLength={6000} value={x.text} onChange={(e) => maj(x.id, "text", e.target.value)} />
                <button className="jeu-lien" onClick={() => { if (confirm("Retirer ce principe ?")) { setP(p.filter((a) => a.id !== x.id)); setModifie(true); } }}>Retirer</button>
              </>
            ) : <><h3>{x.title}</h3><p>{x.text}</p></>}
          </section>
        ))}
      </div>
    </>
  );
}

function Membres({ etat, recharger }: { etat: Etat; recharger: () => Promise<void> }) {
  const vide: Membre = { email: "", nom: "", role: "lecteur", poste: 9 };
  const [edit, setEdit] = useState<(Membre & { existe?: boolean }) | null>(null);
  async function enregistrer(m: Membre) {
    try { await api("/api/admin/jeu/membres", { method: "POST", body: JSON.stringify(m) }); setEdit(null); await recharger(); }
    catch (e) { alert((e as Error).message); }
  }
  async function retirer(m: Membre) {
    if (!confirm(`Retirer ${m.nom} du cahier de jeu ?`)) return;
    try { await api(`/api/admin/jeu/membres?email=${encodeURIComponent(m.email)}`, { method: "DELETE" }); setEdit(null); await recharger(); }
    catch (e) { alert((e as Error).message); }
  }
  return (
    <>
      <div className="adm-bar-top">
        <div><h1>Membres</h1><p className="adm-muted">Qui peut modifier les jeux. Les autres membres du CA peuvent les consulter et les commenter.</p></div>
        <button className="adm-btn" onClick={() => setEdit({ ...vide })}>+ Ajouter</button>
      </div>
      <div className="adm-card jeu-membres">
        {etat.membres.map((m) => (
          <div className="jeu-membre" key={m.email}>
            <div className="adm-avatar" aria-hidden="true">{m.nom.slice(0, 1)}</div>
            <div><strong>{m.nom}</strong><small>{m.email}</small></div>
            <span className="adm-muted">{m.poste} · {positions[m.poste - 1]}</span>
            <span className={`jeu-role ${m.role}`}>{m.role === "editeur" ? "Peut modifier" : "Consulte"}</span>
            <button className="adm-btn line sm" onClick={() => setEdit({ ...m, existe: true })}>Modifier</button>
          </div>
        ))}
      </div>
      <p className="adm-muted jeu-note">Pour une personne hors CA (ex. un joueur), ajoute aussi son courriel dans Cloudflare Zero Trust → Access → politique « CA Barracudas », sinon elle ne pourra pas se connecter. Elle ne verra que le cahier de jeu.</p>
      {edit && (
        <Tiroir titre={edit.existe ? "Modifier le membre" : "Ajouter un membre"} fermer={() => setEdit(null)}>
          <form className="adm-form" onSubmit={(e) => { e.preventDefault(); enregistrer(edit); }}>
            <label>Nom<input required maxLength={120} value={edit.nom} onChange={(e) => setEdit({ ...edit, nom: e.target.value })} /></label>
            <label>Courriel<input required type="email" maxLength={254} disabled={edit.existe} value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></label>
            <label>Rôle
              <select value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value as Membre["role"] })}>
                <option value="editeur">Peut modifier · crée, change et publie des jeux</option>
                <option value="lecteur">Consulte · regarde et commente seulement</option>
              </select>
            </label>
            <label>Poste principal
              <select value={edit.poste} onChange={(e) => setEdit({ ...edit, poste: Number(e.target.value) })}>
                {positions.map((p, n) => <option key={n} value={n + 1}>{n + 1} · {p}</option>)}
              </select>
            </label>
            <div className="adm-form-actions">
              {edit.existe && edit.email !== etat.moi.email && <button type="button" className="adm-btn line danger" onClick={() => retirer(edit)}>Retirer</button>}
              <button className="adm-btn">Enregistrer</button>
            </div>
          </form>
        </Tiroir>
      )}
    </>
  );
}

/** Mode d'emploi en 3 étapes, masquable (préférence gardée sur l'appareil). */
function Guide() {
  const [ouvert, setOuvert] = useState(false);
  useEffect(() => { try { setOuvert(localStorage.getItem("jeu-guide") !== "ferme"); } catch { setOuvert(true); } }, []);
  if (!ouvert) return <button className="jeu-lien jeu-guide-lien" onClick={() => setOuvert(true)}>❓ Comment ça marche ?</button>;
  return (
    <section className="jeu-guide" aria-label="Comment ça marche">
      <ol>
        <li><b>1</b><div><strong>Crée un jeu</strong><span>Clique « + Créer un jeu » et choisis un placement de départ (mêlée, touche…).</span></div></li>
        <li><b>2</b><div><strong>Place les joueurs</strong><span>Glisse les joueurs bleus. Choisis « Course » ou « Passe » et trace une flèche avec le doigt ou la souris.</span></div></li>
        <li><b>3</b><div><strong>Ajoute les phases</strong><span>« + Ajouter une phase » pour la suite du jeu. « ▶ Lire le jeu » montre l’animation.</span></div></li>
        <li><b>4</b><div><strong>Enregistre et publie</strong><span>Un brouillon reste entre nous. « Publier pour l’équipe » le rend visible aux joueurs.</span></div></li>
      </ol>
      <button className="adm-x" aria-label="Masquer l’aide" onClick={() => { setOuvert(false); try { localStorage.setItem("jeu-guide", "ferme"); } catch {} }}>×</button>
    </section>
  );
}
