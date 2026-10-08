"use client";
// Admin du CA — Tâches, Commanditaires, Formulaires reçus.
// Protégé par Cloudflare Access (/admin et /api/admin). Données : Cloudflare D1 via /api/admin/*.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/ui";

type Tache = { id: number; titre: string; details?: string; responsable?: string; echeance?: string; statut: string; ordre: number; cree_par?: string; maj_le: string };
type Commandite = { id: number; entreprise: string; contact?: string; courriel?: string; telephone?: string; site?: string; forfait?: string; entente?: string; montant?: number; statut: string; responsable?: string; prochaine_action?: string; prochaine_date?: string; notes?: string; maj_le: string };
type Soumission = { id: number; type: string; donnees: string; statut: string; note?: string; recu_le: string };

const RESPONSABLES = ["Jean", "Clément", "Christophe", "Marc-André", "Gabriel", "Guillaume"];
const COL_TACHES = [
  { k: "a_faire", label: "À faire" },
  { k: "en_cours", label: "En cours" },
  { k: "fait", label: "Fait" },
];
const ETAPES = [
  { k: "a_contacter", label: "À contacter" },
  { k: "contacte", label: "Contacté" },
  { k: "interesse", label: "Intéressé" },
  { k: "signe", label: "Entente signée" },
  { k: "paye", label: "Payé" },
  { k: "logo_recu", label: "Logo reçu" },
  { k: "refuse", label: "Refusé" },
];
const FORFAITS = ["Or · 1 000 $", "Argent · 750 $", "Bronze · 500 $", "Biens et services", "Ami du club", "Sur mesure"];
const TYPES: Record<string, string> = { contact: "Contact", commandite: "Commandite", precommande: "Réservation boutique" };
const LIB: Record<string, string> = { sujet: "Sujet", nom: "Nom", courriel: "Courriel", telephone: "Téléphone", message: "Message", entreprise: "Entreprise", forfait: "Forfait", entente: "Durée", article: "Article", taille: "Taille", quantite: "Quantité", total: "Total" };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j as { error?: string }).error || `Erreur ${r.status}`);
  return j as T;
}
const today = () => new Date().toISOString().slice(0, 10);
const dateFr = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso.length === 10 ? iso + "T12:00:00" : iso.replace(" ", "T") + "Z");
  return d.toLocaleDateString("fr-CA", { day: "numeric", month: "short" });
};
const argent = (n?: number) => (n ? n.toLocaleString("fr-CA") + " $" : "");

export default function Admin() {
  const [onglet, setOnglet] = useState<"accueil" | "taches" | "commandites" | "formulaires">("accueil");
  const [email, setEmail] = useState("");
  const [erreur, setErreur] = useState("");
  const [taches, setTaches] = useState<Tache[]>([]);
  const [comm, setComm] = useState<Commandite[]>([]);
  const [soum, setSoum] = useState<Soumission[]>([]);
  const [charge, setCharge] = useState(false);

  const recharger = useCallback(async () => {
    try {
      const [m, t, c, s] = await Promise.all([
        api<{ email: string }>("/api/admin/moi"),
        api<{ items: Tache[] }>("/api/admin/taches"),
        api<{ items: Commandite[] }>("/api/admin/commandites"),
        api<{ items: Soumission[] }>("/api/admin/soumissions"),
      ]);
      setEmail(m.email); setTaches(t.items); setComm(c.items); setSoum(s.items); setErreur("");
    } catch (e) { setErreur((e as Error).message); }
    setCharge(true);
  }, []);
  useEffect(() => { recharger(); }, [recharger]);
  useEffect(() => { try { const o = localStorage.getItem("adm-onglet"); if (o) setOnglet(o as typeof onglet); } catch {} }, []);
  const aller = (o: typeof onglet) => { setOnglet(o); try { localStorage.setItem("adm-onglet", o); } catch {} };

  const nouveaux = soum.filter((s) => s.statut === "nouveau").length;
  const ouvertes = taches.filter((t) => t.statut !== "fait").length;

  return (
    <div className="adm">
      <header className="adm-top">
        <a href="/" className="adm-brand" title="Voir le site"><Logo /><span>Admin <b>CA Barracudas</b></span></a>
        <div className="adm-user">
          {email && <span className="adm-email">{email}</span>}
          <a className="adm-btn line sm" href="/cdn-cgi/access/logout">Déconnexion</a>
        </div>
      </header>
      <nav className="adm-tabs" aria-label="Sections">
        {([
          ["accueil", "Tableau de bord", 0],
          ["taches", "Tâches", ouvertes],
          ["commandites", "Commanditaires", 0],
          ["formulaires", "Formulaires reçus", nouveaux],
        ] as const).map(([k, l, n]) => (
          <button key={k} className={onglet === k ? "on" : ""} onClick={() => aller(k)}>{l}{n ? <i>{n}</i> : null}</button>
        ))}
      </nav>
      <main className="adm-main">
        {erreur && <p className="adm-alert">{erreur === "Accès refusé." ? "Accès refusé : ton adresse n'est pas dans la liste des membres du CA." : erreur}</p>}
        {!charge ? <p className="adm-muted">Chargement…</p> : (
          <>
            {onglet === "accueil" && <Accueil taches={taches} comm={comm} soum={soum} aller={aller} />}
            {onglet === "taches" && <Taches items={taches} setItems={setTaches} />}
            {onglet === "commandites" && <Commandites items={comm} setItems={setComm} />}
            {onglet === "formulaires" && <Formulaires items={soum} setItems={setSoum} creerCommandite={async (d) => {
              const r = await api<{ item: Commandite }>("/api/admin/commandites", { method: "POST", body: JSON.stringify({ entreprise: d.entreprise || d.nom || "Sans nom", contact: d.nom, courriel: d.courriel, telephone: d.telephone, forfait: d.forfait, entente: d.entente, notes: d.message, statut: "interesse" }) });
              setComm((x) => [r.item, ...x]); aller("commandites");
            }} />}
          </>
        )}
      </main>
    </div>
  );
}

/* ---------------- Tableau de bord ---------------- */
function Accueil({ taches, comm, soum, aller }: { taches: Tache[]; comm: Commandite[]; soum: Soumission[]; aller: (o: "taches" | "commandites" | "formulaires") => void }) {
  const t = today();
  const enRetard = taches.filter((x) => x.statut !== "fait" && x.echeance && x.echeance < t);
  const signes = comm.filter((c) => ["signe", "paye", "logo_recu"].includes(c.statut));
  const total = signes.reduce((s, c) => s + (c.montant ?? 0), 0);
  const relances = comm.filter((c) => c.prochaine_date && c.prochaine_date <= t && !["refuse", "logo_recu"].includes(c.statut));
  const nouveaux = soum.filter((s) => s.statut === "nouveau");
  const tuiles = [
    { n: taches.filter((x) => x.statut !== "fait").length, l: "Tâches ouvertes", s: enRetard.length ? `${enRetard.length} en retard` : "Aucune en retard", o: "taches" as const, alerte: enRetard.length > 0 },
    { n: signes.length, l: "Commanditaires signés", s: total ? `${argent(total)} confirmés` : "Montants à saisir", o: "commandites" as const },
    { n: relances.length, l: "Relances à faire", s: "Commanditaires dont la date est arrivée", o: "commandites" as const, alerte: relances.length > 0 },
    { n: nouveaux.length, l: "Formulaires à traiter", s: "Contact, commandites, réservations", o: "formulaires" as const, alerte: nouveaux.length > 0 },
  ];
  return (
    <>
      <div className="adm-tiles">
        {tuiles.map((x) => (
          <button key={x.l} className={"adm-tile" + (x.alerte ? " alert" : "")} onClick={() => aller(x.o)}>
            <b>{x.n}</b><span>{x.l}</span><small>{x.s}</small>
          </button>
        ))}
      </div>
      <div className="adm-grid2">
        <section className="adm-card">
          <h2>Prochaines échéances</h2>
          {taches.filter((x) => x.statut !== "fait" && x.echeance).sort((a, b) => a.echeance!.localeCompare(b.echeance!)).slice(0, 6).map((x) => (
            <p key={x.id} className="adm-line"><span className={"adm-date" + (x.echeance! < t ? " late" : "")}>{dateFr(x.echeance)}</span>{x.titre}<em>{x.responsable}</em></p>
          ))}
          {!taches.some((x) => x.statut !== "fait" && x.echeance) && <p className="adm-muted">Aucune tâche datée.</p>}
        </section>
        <section className="adm-card">
          <h2>Pipeline des commandites</h2>
          {ETAPES.filter((e) => e.k !== "refuse").map((e) => {
            const n = comm.filter((c) => c.statut === e.k).length;
            const max = Math.max(1, ...ETAPES.map((z) => comm.filter((c) => c.statut === z.k).length));
            return <div key={e.k} className="adm-bar"><span>{e.label}</span><i style={{ width: `${(n / max) * 100}%` }} /><b>{n}</b></div>;
          })}
        </section>
      </div>
    </>
  );
}

/* ---------------- Tâches (tableau kanban) ---------------- */
function Taches({ items, setItems }: { items: Tache[]; setItems: React.Dispatch<React.SetStateAction<Tache[]>> }) {
  const [edit, setEdit] = useState<Partial<Tache> | null>(null);
  const [glisse, setGlisse] = useState<number | null>(null);
  const [filtre, setFiltre] = useState("");
  const t = today();

  async function maj(id: number, patch: Partial<Tache>) {
    setItems((x) => x.map((y) => (y.id === id ? { ...y, ...patch } : y)));
    try { const r = await api<{ item: Tache }>(`/api/admin/taches/${id}`, { method: "PATCH", body: JSON.stringify(patch) }); setItems((x) => x.map((y) => (y.id === id ? r.item : y))); }
    catch (e) { alert((e as Error).message); }
  }
  async function enregistrer(f: Partial<Tache>) {
    if (!f.titre?.trim()) return;
    if (f.id) await maj(f.id, f);
    else {
      const r = await api<{ item: Tache }>("/api/admin/taches", { method: "POST", body: JSON.stringify({ statut: "a_faire", ...f }) });
      setItems((x) => [r.item, ...x]);
    }
    setEdit(null);
  }
  async function supprimer(id: number) {
    if (!confirm("Supprimer cette tâche ?")) return;
    await api(`/api/admin/taches/${id}`, { method: "DELETE" });
    setItems((x) => x.filter((y) => y.id !== id)); setEdit(null);
  }
  const visibles = filtre ? items.filter((x) => x.responsable === filtre) : items;

  return (
    <>
      <div className="adm-bar-top">
        <h1>Tâches du CA</h1>
        <div className="adm-actions">
          <select value={filtre} onChange={(e) => setFiltre(e.target.value)} aria-label="Filtrer par responsable">
            <option value="">Tout le monde</option>{RESPONSABLES.map((r) => <option key={r}>{r}</option>)}
          </select>
          <button className="adm-btn" onClick={() => setEdit({ statut: "a_faire" })}>+ Nouvelle tâche</button>
        </div>
      </div>
      <div className="adm-kanban">
        {COL_TACHES.map((col) => (
          <section key={col.k} className={"adm-col" + (glisse ? " drop" : "")}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (glisse) maj(glisse, { statut: col.k }); setGlisse(null); }}>
            <h2>{col.label} <span>{visibles.filter((x) => x.statut === col.k).length}</span></h2>
            {visibles.filter((x) => x.statut === col.k).map((x) => (
              <article key={x.id} className={"adm-task" + (x.statut === "fait" ? " done" : "")} draggable
                onDragStart={() => setGlisse(x.id)} onDragEnd={() => setGlisse(null)} onClick={() => setEdit(x)}>
                <p>{x.titre}</p>
                <div>
                  {x.responsable && <span className="adm-chip">{x.responsable}</span>}
                  {x.echeance && <span className={"adm-date" + (x.statut !== "fait" && x.echeance < t ? " late" : "")}>{dateFr(x.echeance)}</span>}
                  <span className="adm-move" onClick={(e) => e.stopPropagation()}>
                    {col.k !== "a_faire" && <button aria-label="Reculer" onClick={() => maj(x.id, { statut: COL_TACHES[COL_TACHES.findIndex((c) => c.k === col.k) - 1].k })}>←</button>}
                    {col.k !== "fait" && <button aria-label="Avancer" onClick={() => maj(x.id, { statut: COL_TACHES[COL_TACHES.findIndex((c) => c.k === col.k) + 1].k })}>→</button>}
                  </span>
                </div>
              </article>
            ))}
            <AjoutRapide onAdd={(titre) => enregistrer({ titre, statut: col.k })} />
          </section>
        ))}
      </div>
      {edit && (
        <Tiroir titre={edit.id ? "Modifier la tâche" : "Nouvelle tâche"} fermer={() => setEdit(null)}>
          <FormTache init={edit} onSave={enregistrer} onDelete={edit.id ? () => supprimer(edit.id!) : undefined} />
        </Tiroir>
      )}
    </>
  );
}

function AjoutRapide({ onAdd }: { onAdd: (t: string) => void }) {
  const [v, setV] = useState("");
  return (
    <form className="adm-quick" onSubmit={(e) => { e.preventDefault(); if (v.trim()) { onAdd(v.trim()); setV(""); } }}>
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder="+ Ajouter une tâche" aria-label="Ajouter une tâche" />
    </form>
  );
}

function FormTache({ init, onSave, onDelete }: { init: Partial<Tache>; onSave: (f: Partial<Tache>) => void; onDelete?: () => void }) {
  const [f, setF] = useState(init);
  const s = (k: keyof Tache) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form className="adm-form" onSubmit={(e) => { e.preventDefault(); onSave(f); }}>
      <label>Titre *<input value={f.titre ?? ""} onChange={s("titre")} required autoFocus /></label>
      <div className="adm-row">
        <label>Responsable<select value={f.responsable ?? ""} onChange={s("responsable")}><option value="">—</option>{RESPONSABLES.map((r) => <option key={r}>{r}</option>)}</select></label>
        <label>Échéance<input type="date" value={f.echeance ?? ""} onChange={s("echeance")} /></label>
      </div>
      <label>Statut<select value={f.statut ?? "a_faire"} onChange={s("statut")}>{COL_TACHES.map((c) => <option key={c.k} value={c.k}>{c.label}</option>)}</select></label>
      <label>Détails<textarea value={f.details ?? ""} onChange={s("details")} rows={6} /></label>
      {f.cree_par && <p className="adm-muted">Créée par {f.cree_par}</p>}
      <div className="adm-form-actions">
        {onDelete && <button type="button" className="adm-btn danger line" onClick={onDelete}>Supprimer</button>}
        <button className="adm-btn">Enregistrer</button>
      </div>
    </form>
  );
}

/* ---------------- Commanditaires ---------------- */
function Commandites({ items, setItems }: { items: Commandite[]; setItems: React.Dispatch<React.SetStateAction<Commandite[]>> }) {
  const [edit, setEdit] = useState<Partial<Commandite> | null>(null);
  const [etape, setEtape] = useState("");
  const t = today();
  const liste = useMemo(() => (etape ? items.filter((c) => c.statut === etape) : items.filter((c) => c.statut !== "refuse")), [items, etape]);
  const total = items.filter((c) => ["signe", "paye", "logo_recu"].includes(c.statut)).reduce((s, c) => s + (c.montant ?? 0), 0);

  async function enregistrer(f: Partial<Commandite>) {
    if (!f.entreprise?.trim()) return;
    if (f.montant !== undefined && f.montant !== null) f.montant = Number(f.montant) || undefined;
    if (f.id) {
      const r = await api<{ item: Commandite }>(`/api/admin/commandites/${f.id}`, { method: "PATCH", body: JSON.stringify(f) });
      setItems((x) => x.map((y) => (y.id === f.id ? r.item : y)));
    } else {
      const r = await api<{ item: Commandite }>("/api/admin/commandites", { method: "POST", body: JSON.stringify({ statut: "a_contacter", ...f }) });
      setItems((x) => [r.item, ...x]);
    }
    setEdit(null);
  }
  async function statut(c: Commandite, s: string) {
    setItems((x) => x.map((y) => (y.id === c.id ? { ...y, statut: s } : y)));
    await api(`/api/admin/commandites/${c.id}`, { method: "PATCH", body: JSON.stringify({ statut: s }) });
  }
  async function supprimer(id: number) {
    if (!confirm("Supprimer ce commanditaire ?")) return;
    await api(`/api/admin/commandites/${id}`, { method: "DELETE" });
    setItems((x) => x.filter((y) => y.id !== id)); setEdit(null);
  }

  return (
    <>
      <div className="adm-bar-top">
        <h1>Commanditaires</h1>
        <div className="adm-actions">
          <span className="adm-total">Confirmé : <b>{argent(total) || "0 $"}</b></span>
          <button className="adm-btn" onClick={() => setEdit({ statut: "a_contacter" })}>+ Nouveau</button>
        </div>
      </div>
      <div className="adm-steps">
        <button className={!etape ? "on" : ""} onClick={() => setEtape("")}>Actifs <i>{items.filter((c) => c.statut !== "refuse").length}</i></button>
        {ETAPES.map((e) => <button key={e.k} className={etape === e.k ? "on" : ""} onClick={() => setEtape(e.k)}>{e.label} <i>{items.filter((c) => c.statut === e.k).length}</i></button>)}
      </div>
      {liste.length === 0 ? <p className="adm-empty">Aucun commanditaire ici. Ajoute le premier avec « + Nouveau ».</p> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Entreprise</th><th>Étape</th><th>Forfait</th><th>Montant</th><th>Responsable</th><th>Prochaine action</th></tr></thead>
            <tbody>
              {liste.map((c) => (
                <tr key={c.id} onClick={() => setEdit(c)}>
                  <td><b>{c.entreprise}</b>{c.contact && <small>{c.contact}</small>}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select className={"adm-stage s-" + c.statut} value={c.statut} onChange={(e) => statut(c, e.target.value)}>{ETAPES.map((e) => <option key={e.k} value={e.k}>{e.label}</option>)}</select>
                  </td>
                  <td>{c.forfait}{c.entente && <small>{c.entente}</small>}</td>
                  <td>{argent(c.montant)}</td>
                  <td>{c.responsable}</td>
                  <td>{c.prochaine_action}{c.prochaine_date && <small className={c.prochaine_date <= t ? "late" : ""}>{dateFr(c.prochaine_date)}</small>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {edit && (
        <Tiroir titre={edit.id ? edit.entreprise ?? "Commanditaire" : "Nouveau commanditaire"} fermer={() => setEdit(null)}>
          <FormCommandite init={edit} onSave={enregistrer} onDelete={edit.id ? () => supprimer(edit.id!) : undefined} />
        </Tiroir>
      )}
    </>
  );
}

function FormCommandite({ init, onSave, onDelete }: { init: Partial<Commandite>; onSave: (f: Partial<Commandite>) => void; onDelete?: () => void }) {
  const [f, setF] = useState(init);
  const s = (k: keyof Commandite) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <form className="adm-form" onSubmit={(e) => { e.preventDefault(); onSave(f); }}>
      <label>Entreprise *<input value={f.entreprise ?? ""} onChange={s("entreprise")} required autoFocus /></label>
      <div className="adm-row">
        <label>Personne-ressource<input value={f.contact ?? ""} onChange={s("contact")} /></label>
        <label>Téléphone<input value={f.telephone ?? ""} onChange={s("telephone")} /></label>
      </div>
      <div className="adm-row">
        <label>Courriel<input type="email" value={f.courriel ?? ""} onChange={s("courriel")} /></label>
        <label>Site web<input value={f.site ?? ""} onChange={s("site")} placeholder="https://" /></label>
      </div>
      <div className="adm-row">
        <label>Étape<select value={f.statut ?? "a_contacter"} onChange={s("statut")}>{ETAPES.map((e) => <option key={e.k} value={e.k}>{e.label}</option>)}</select></label>
        <label>Responsable<select value={f.responsable ?? ""} onChange={s("responsable")}><option value="">—</option>{RESPONSABLES.map((r) => <option key={r}>{r}</option>)}</select></label>
      </div>
      <div className="adm-row">
        <label>Forfait<select value={f.forfait ?? ""} onChange={s("forfait")}><option value="">—</option>{FORFAITS.map((x) => <option key={x}>{x}</option>)}{f.forfait && !FORFAITS.includes(f.forfait) && <option>{f.forfait}</option>}</select></label>
        <label>Montant ($)<input type="number" min="0" step="1" value={f.montant ?? ""} onChange={s("montant")} /></label>
      </div>
      <label>Durée<select value={f.entente ?? ""} onChange={s("entente")}><option value="">—</option><option>1 an</option><option>Entente de 3 ans (logo sur le maillot)</option>{f.entente && !["1 an", "Entente de 3 ans (logo sur le maillot)"].includes(f.entente) && <option>{f.entente}</option>}</select></label>
      <div className="adm-row">
        <label>Prochaine action<input value={f.prochaine_action ?? ""} onChange={s("prochaine_action")} placeholder="ex. Relancer par téléphone" /></label>
        <label>Date<input type="date" value={f.prochaine_date ?? ""} onChange={s("prochaine_date")} /></label>
      </div>
      <label>Notes<textarea value={f.notes ?? ""} onChange={s("notes")} rows={5} /></label>
      {f.courriel && <a className="adm-link" href={`mailto:${f.courriel}`}>Écrire à {f.courriel}</a>}
      <div className="adm-form-actions">
        {onDelete && <button type="button" className="adm-btn danger line" onClick={onDelete}>Supprimer</button>}
        <button className="adm-btn">Enregistrer</button>
      </div>
    </form>
  );
}

/* ---------------- Formulaires reçus ---------------- */
function Formulaires({ items, setItems, creerCommandite }: { items: Soumission[]; setItems: React.Dispatch<React.SetStateAction<Soumission[]>>; creerCommandite: (d: Record<string, string>) => Promise<void> }) {
  const [type, setType] = useState("");
  const [vue, setVue] = useState<"nouveau" | "traite">("nouveau");
  const liste = items.filter((s) => (!type || s.type === type) && (vue === "nouveau" ? s.statut === "nouveau" : s.statut !== "nouveau"));
  async function marquer(s: Soumission, statut: string) {
    setItems((x) => x.map((y) => (y.id === s.id ? { ...y, statut } : y)));
    await api(`/api/admin/soumissions/${s.id}`, { method: "PATCH", body: JSON.stringify({ statut }) });
  }
  return (
    <>
      <div className="adm-bar-top">
        <h1>Formulaires reçus</h1>
        <div className="adm-actions">
          <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Type"><option value="">Tous les types</option>{Object.entries(TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        </div>
      </div>
      <div className="adm-steps">
        <button className={vue === "nouveau" ? "on" : ""} onClick={() => setVue("nouveau")}>À traiter <i>{items.filter((s) => s.statut === "nouveau").length}</i></button>
        <button className={vue === "traite" ? "on" : ""} onClick={() => setVue("traite")}>Traités <i>{items.filter((s) => s.statut !== "nouveau").length}</i></button>
      </div>
      {liste.length === 0 ? <p className="adm-empty">{vue === "nouveau" ? "Rien à traiter. Les formulaires du site (contact, commandite, réservation) arrivent ici." : "Aucun formulaire traité."}</p> : (
        <div className="adm-subs">
          {liste.map((s) => {
            let d: Record<string, string> = {};
            try { d = JSON.parse(s.donnees); } catch {}
            return (
              <article key={s.id} className="adm-card adm-sub">
                <header><span className={"adm-type t-" + s.type}>{TYPES[s.type] ?? s.type}</span><time>{dateFr(s.recu_le)}</time></header>
                <dl>{Object.entries(d).map(([k, v]) => <div key={k} className={k === "message" ? "wide" : ""}><dt>{LIB[k] ?? k}</dt><dd>{k === "courriel" ? <a href={`mailto:${v}`}>{v}</a> : v}</dd></div>)}</dl>
                <div className="adm-sub-foot">
                  {d.courriel && <a className="adm-btn line sm" href={`mailto:${d.courriel}?subject=${encodeURIComponent("Barracudas Rugby")}`}>Répondre</a>}
                  {s.type === "commandite" && <button className="adm-btn line sm" onClick={async () => { await creerCommandite(d); await marquer(s, "traite"); }}>Ajouter aux commanditaires</button>}
                  {s.statut === "nouveau"
                    ? <button className="adm-btn sm" onClick={() => marquer(s, "traite")}>Marquer traité</button>
                    : <button className="adm-btn line sm" onClick={() => marquer(s, "nouveau")}>Remettre à traiter</button>}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ---------------- Tiroir (panneau latéral) ---------------- */
function Tiroir({ titre, fermer, children }: { titre: string; fermer: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && fermer();
    addEventListener("keydown", k); return () => removeEventListener("keydown", k);
  }, [fermer]);
  return (
    <div className="adm-drawer-bg" onClick={fermer}>
      <aside className="adm-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={titre}>
        <header><h2>{titre}</h2><button className="adm-x" onClick={fermer} aria-label="Fermer">×</button></header>
        {children}
      </aside>
    </div>
  );
}
