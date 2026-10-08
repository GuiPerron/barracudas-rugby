"use client";
// Système de jeu : la structure d'attaque de l'équipe (1-4-4-1, 2-4-2…), dessinée sur le terrain.
import { useMemo, useState } from "react";
import { api } from "@/components/admin/commun";
import { Terrain } from "./Terrain";
import { positions, type Phase } from "@/lib/jeu/playbook";
import { STRUCTURES, derriere, nouveauSysteme, phaseDuSysteme, podsPour, structureDe, type Systeme } from "@/lib/jeu/systeme";

export type DonneesSysteme = { systemes: Systeme[] };
const nomPod = (k: number, n: number) => (n === 1 ? "Pod unique" : k === 0 ? "Bord gauche" : k === n - 1 ? "Bord droit" : n === 3 ? "Centre" : k < n / 2 ? "Centre gauche" : "Centre droit");

export function SystemeDeJeu({ donnees, version, editable, onEnregistre, modifie, setModifie }: {
  donnees: DonneesSysteme; version: number; editable: boolean;
  onEnregistre: (d: DonneesSysteme, version: number) => void;
  modifie: boolean; setModifie: (b: boolean) => void;
}) {
  const [liste, setListe] = useState<Systeme[]>(donnees.systemes);
  const [actif, setActif] = useState(donnees.systemes[0]?.id ?? "");
  const [occupe, setOccupe] = useState(false);
  const [autre, setAutre] = useState("");

  const s = liste.find((x) => x.id === actif) ?? liste[0];
  const phase = useMemo(() => (s ? phaseDuSysteme(s) : null), [s]);
  const maj = (patch: Partial<Systeme>) => { setListe((l) => l.map((x) => (x.id === s.id ? { ...x, ...patch } : x))); setModifie(true); };
  const majPods = (pods: number[][], roles = s.rolesPods) => maj({ pods, rolesPods: pods.map((_, k) => roles[k] ?? ""), placement: null });

  function choisirStructure(str: string) {
    if (!/^[1-6](-[1-6]){0,7}$/.test(str)) { alert("Écris la structure avec des tirets, par exemple 1-4-4-1."); return; }
    if (structureDe(s) !== str && !confirm(`Passer à ${str} ? Les joueurs seront répartis de nouveau (tu pourras les changer).`)) return;
    const pods = podsPour(str);
    maj({ pods, rolesPods: pods.map(() => ""), placement: null, nom: s.nom.startsWith("Notre système") ? `Notre système ${str}` : s.nom });
  }
  async function enregistrer() {
    setOccupe(true);
    try {
      const r = await api<{ systeme: DonneesSysteme; version: number }>("/api/admin/jeu/systeme", { method: "PUT", body: JSON.stringify({ systeme: { systemes: liste }, version }) });
      onEnregistre(r.systeme, r.version); setModifie(false);
    } catch (e) { alert((e as Error).message); }
    setOccupe(false);
  }
  function ajouterSysteme() {
    const n = nouveauSysteme("1-3-3-1");
    setListe((l) => [...l, n]); setActif(n.id); setModifie(true);
  }
  function supprimerSysteme() {
    if (!confirm(`Supprimer « ${s.nom} » ?`)) return;
    const reste = liste.filter((x) => x.id !== s.id);
    setListe(reste); setActif(reste[0]?.id ?? ""); setModifie(true);
  }

  if (!s || !phase) {
    return (
      <>
        <div className="adm-bar-top"><h1>Système de jeu</h1></div>
        <div className="adm-empty">
          <p>Aucun système de jeu pour l’instant.</p>
          {editable && <button className="adm-btn" style={{ marginTop: 12 }} onClick={ajouterSysteme}>+ Créer notre système</button>}
        </div>
        {editable && modifie && <Sauver occupe={occupe} enregistrer={enregistrer} />}
      </>
    );
  }

  const libres = derriere(s);
  const groupes = s.pods.map((p, k) => ({ joueurs: p, etiquette: String(k + 1) }));

  return (
    <>
      <div className="adm-bar-top">
        <div>
          <h1>Système de jeu</h1>
          <p className="adm-muted">Comment on se répartit sur la largeur du terrain en attaque.</p>
        </div>
        {editable && <button className="adm-btn line sm" onClick={ajouterSysteme} disabled={liste.length >= 10}>+ Autre système</button>}
      </div>

      {liste.length > 1 && (
        <div className="jeu-filtres" role="tablist">
          {liste.map((x) => <button key={x.id} className={x.id === s.id ? "on" : ""} onClick={() => setActif(x.id)}>{x.nom}</button>)}
        </div>
      )}

      <div className="jeu-grille">
        <section className="jeu-tableau">
          <div className="jeu-sys-titre">
            <span className="jeu-sys-code">{structureDe(s)}</span>
            {editable ? <input aria-label="Nom du système" maxLength={80} value={s.nom} onChange={(e) => maj({ nom: e.target.value })} /> : <h2>{s.nom}</h2>}
          </div>

          {editable && (
            <div className="jeu-sys-structures">
              <span>Structure :</span>
              {STRUCTURES.map((str) => <button key={str} className={structureDe(s) === str ? "on" : ""} onClick={() => choisirStructure(str)}>{str}</button>)}
              <form onSubmit={(e) => { e.preventDefault(); if (autre) choisirStructure(autre.trim()); }}>
                <input value={autre} onChange={(e) => setAutre(e.target.value)} placeholder="Autre : 1-3-2-2" aria-label="Autre structure" />
                <button className="adm-btn line sm">OK</button>
              </form>
            </div>
          )}

          <div className="jeu-cadre">
            <Terrain phase={phase} editable={editable} groupes={groupes}
              onChange={(p: Phase) => maj({ placement: p.players.filter((x) => x.team === "home") })} />
          </div>
          <div className="jeu-legende">
            <span><i className="nous" />Nos joueurs</span>
            <span><i className="l-pod" />Pod (groupe de joueurs)</span>
            <span className="sens">Sens de l’attaque ⟶</span>
          </div>
          {editable && (
            <div className="jeu-ligne">
              <span className="adm-muted">✋ Glisse un joueur pour ajuster sa place.</span>
              {s.placement && <button className="adm-btn line sm" onClick={() => maj({ placement: null })}>Replacer automatiquement</button>}
            </div>
          )}
        </section>

        <aside className="jeu-panneau">
          <h3 className="jeu-sys-h">Les pods, de gauche à droite</h3>
          <div className="jeu-pods">
            {s.pods.map((pod, k) => (
              <div className="jeu-pod" key={k}>
                <header><b>{k + 1}</b><strong>{nomPod(k, s.pods.length)}</strong><span>{pod.length} joueur{pod.length > 1 ? "s" : ""}</span></header>
                <div className="jeu-puces">
                  {pod.map((n) => (
                    <span className="jeu-puce" key={n} title={positions[n - 1]}>
                      <b>{n}</b>{positions[n - 1]}
                      {editable && pod.length > 1 && <button aria-label={`Retirer le ${n} du pod`} onClick={() => majPods(s.pods.map((p, j) => (j === k ? p.filter((x) => x !== n) : p)))}>×</button>}
                    </span>
                  ))}
                </div>
                {editable && libres.length > 0 && pod.length < 6 && (
                  <select value="" aria-label={`Ajouter un joueur au pod ${k + 1}`}
                    onChange={(e) => { const n = Number(e.target.value); if (n) majPods(s.pods.map((p, j) => (j === k ? [...p, n].sort((a, b) => a - b) : p))); }}>
                    <option value="">+ Ajouter un joueur…</option>
                    {libres.map((n) => <option key={n} value={n}>{n} · {positions[n - 1]}</option>)}
                  </select>
                )}
                {editable
                  ? <input className="jeu-pod-role" maxLength={300} value={s.rolesPods[k] ?? ""} placeholder="Rôle du pod (ex. fixer et libérer vite)"
                      onChange={(e) => maj({ rolesPods: s.rolesPods.map((r, j) => (j === k ? e.target.value : r)) })} />
                  : s.rolesPods[k] && <p className="jeu-texte">{s.rolesPods[k]}</p>}
              </div>
            ))}
          </div>

          <h3 className="jeu-sys-h">Derrière les pods</h3>
          <div className="jeu-puces">
            {libres.map((n) => <span className="jeu-puce libre" key={n}><b>{n}</b>{positions[n - 1]}</span>)}
          </div>

          <h3 className="jeu-sys-h">Notes</h3>
          {editable
            ? <textarea rows={3} maxLength={4000} value={s.note} placeholder="Facultatif : quand utiliser ce système, mots d’annonce…" onChange={(e) => maj({ note: e.target.value })} />
            : <p className="jeu-texte">{s.note || "—"}</p>}

          {editable && <button className="jeu-lien danger" onClick={supprimerSysteme}>Supprimer ce système</button>}
        </aside>
      </div>
      {editable && modifie && <Sauver occupe={occupe} enregistrer={enregistrer} />}
    </>
  );
}

function Sauver({ occupe, enregistrer }: { occupe: boolean; enregistrer: () => void }) {
  return (
    <div className="jeu-sauver" role="status">
      <span>Tu as des changements pas encore enregistrés.</span>
      <button className="adm-btn" disabled={occupe} onClick={enregistrer}>{occupe ? "Enregistrement…" : "Enregistrer"}</button>
    </div>
  );
}

