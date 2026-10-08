"use client";
// Admin du CA — Tâches, Commanditaires, Formulaires reçus.
// Protégé par Cloudflare Access (/admin et /api/admin). Données : Cloudflare D1 via /api/admin/*.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/ui";

type Tache = { id: number; titre: string; details?: string; responsable?: string; echeance?: string; statut: string; ordre: number; cree_par?: string; maj_le: string };
type Commandite = { id: number; entreprise: string; contact?: string; courriel?: string; telephone?: string; site?: string; forfait?: string; entente?: string; montant?: number; statut: string; responsable?: string; prochaine_action?: string; prochaine_date?: string; notes?: string; maj_le: string };
type Soumission = { id: number; type: string; donnees: string; statut: string; note?: string; recu_le: string };

const NOMS: Record<string, string> = { "guillaume.perron": "Guillaume", info: "Jean", commandites: "Clément", technique: "Christophe", tresorier: "Marc-André", secretaire: "Gabriel" };
const nom = (email: string) => NOMS[email.split("@")[0]] ?? email.split("@")[0];
type Commentaire = { id: number; objet: string; objet_id: number; auteur: string; texte: string; cree_le: string };
type Comptes = Record<string, number>;
type Onglet = "accueil" | "calendrier" | "taches" | "commandites" | "boutique" | "formulaires";
const STOCK_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQyW52TNHkjxOzpxP601Wvtnqk9EPXt85Hg5f09Hpu_r-lR_2OkVcM0Qek5FfSE_rBpoLLx9Ofg6mk1/pub?gid=0&single=true&output=csv";
const STOCK_SHEET = "https://docs.google.com/spreadsheets/d/1U47fd-tFfBcbK6MYYQfqbUMstz_kgPBsVIhjy-DfA2o/edit";
const PRIX_TSHIRT = 25;
const ETAPES_RES = [
  { k: "nouveau", label: "Réservé" },
  { k: "paye", label: "Payé" },
  { k: "remis", label: "Remis" },
  { k: "annule", label: "Annulé" },
];
const salutation = () => { const h = new Date().getHours(); return h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir"; };
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
  const [onglet, setOnglet] = useState<Onglet>("accueil");
  const [email, setEmail] = useState("");
  const [erreur, setErreur] = useState("");
  const [taches, setTaches] = useState<Tache[]>([]);
  const [comm, setComm] = useState<Commandite[]>([]);
  const [soum, setSoum] = useState<Soumission[]>([]);
  const [charge, setCharge] = useState(false);
  const [comptes, setComptes] = useState<Comptes>({});

  const recharger = useCallback(async () => {
    try {
      const [m, t, c, s, k] = await Promise.all([
        api<{ email: string }>("/api/admin/moi"),
        api<{ items: Tache[] }>("/api/admin/taches"),
        api<{ items: Commandite[] }>("/api/admin/commandites"),
        api<{ items: Soumission[] }>("/api/admin/soumissions"),
        api<{ comptes: { objet: string; objet_id: number; n: number }[] }>("/api/admin/commentaires"),
      ]);
      setEmail(m.email); setTaches(t.items); setComm(c.items); setSoum(s.items); setErreur("");
      setComptes(Object.fromEntries(k.comptes.map((x) => [`${x.objet}:${x.objet_id}`, x.n])));
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
          ["accueil", "Mon tableau", 0],
          ["calendrier", "Calendrier", 0],
          ["taches", "Tâches", ouvertes],
          ["commandites", "Commanditaires", 0],
          ["boutique", "Boutique", soum.filter((x) => x.type === "precommande" && x.statut === "nouveau").length],
          ["formulaires", "Formulaires reçus", nouveaux],
        ] as const).map(([k, l, n]) => (
          <button key={k} className={onglet === k ? "on" : ""} onClick={() => aller(k)}>{l}{n ? <i>{n}</i> : null}</button>
        ))}
      </nav>
      <main className="adm-main">
        {erreur && <p className="adm-alert">{erreur === "Accès refusé." ? "Accès refusé : ton adresse n'est pas dans la liste des membres du CA." : erreur}</p>}
        {!charge ? <p className="adm-muted">Chargement…</p> : (
          <>
            {onglet === "accueil" && <Accueil taches={taches} comm={comm} soum={soum} aller={aller} email={email} />}
            {onglet === "boutique" && <Boutique items={soum} setItems={setSoum} />}
            {onglet === "calendrier" && <Calendrier taches={taches} comm={comm} aller={aller} />}
            {onglet === "taches" && <Taches items={taches} setItems={setTaches} email={email} comptes={comptes} setComptes={setComptes} />}
            {onglet === "commandites" && <Commandites items={comm} setItems={setComm} email={email} comptes={comptes} setComptes={setComptes} />}
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
function Accueil({ taches, comm, soum, aller, email }: { taches: Tache[]; comm: Commandite[]; soum: Soumission[]; aller: (o: Onglet) => void; email: string }) {
  const moi = email ? nom(email) : "";
  const tj = today();
  const mesTaches = taches.filter((x) => x.statut !== "fait" && x.responsable === moi).sort((a, b) => (a.echeance ?? "9999").localeCompare(b.echeance ?? "9999"));
  const mesRelances = comm.filter((c) => c.responsable === moi && c.prochaine_date && !["refuse", "logo_recu"].includes(c.statut)).sort((a, b) => a.prochaine_date!.localeCompare(b.prochaine_date!));
  const enRetardMoi = mesTaches.filter((x) => x.echeance && x.echeance < tj).length + mesRelances.filter((c) => c.prochaine_date! <= tj).length;
  const resume = !moi ? "" : enRetardMoi ? `${enRetardMoi} élément${enRetardMoi > 1 ? "s" : ""} en retard ou dû aujourd’hui.` : mesTaches.length || mesRelances.length ? "Rien en retard. Voici ce qui t’attend." : "Rien d’assigné à ton nom pour l’instant.";
  const perso = (
    <section className="adm-hello">
      <div>
        <p className="adm-hello-date">{new Date().toLocaleDateString("fr-CA", { weekday: "long", day: "numeric", month: "long" })}</p>
        <h1>{salutation()}{moi ? `, ${moi}` : ""} !</h1>
        <p>{resume}</p>
      </div>
      <div className="adm-mine">
        <div className="adm-card">
          <h2>Mes tâches <span className="adm-count">{mesTaches.length}</span></h2>
          {mesTaches.slice(0, 6).map((x) => (
            <p key={x.id} className="adm-line">{x.echeance ? <span className={"adm-date" + (x.echeance < tj ? " late" : "")}>{dateFr(x.echeance)}</span> : <span className="adm-date">—</span>}{x.titre}<em>{COL_TACHES.find((c) => c.k === x.statut)?.label}</em></p>
          ))}
          {!mesTaches.length && <p className="adm-muted">Aucune tâche ouverte à ton nom.</p>}
          <button className="adm-link-btn" onClick={() => aller("taches")}>Voir toutes les tâches →</button>
        </div>
        <div className="adm-card">
          <h2>Mes relances <span className="adm-count">{mesRelances.length}</span></h2>
          {mesRelances.slice(0, 6).map((c) => (
            <p key={c.id} className="adm-line"><span className={"adm-date" + (c.prochaine_date! <= tj ? " late" : "")}>{dateFr(c.prochaine_date)}</span>{c.entreprise}<em>{c.prochaine_action}</em></p>
          ))}
          {!mesRelances.length && <p className="adm-muted">Aucune relance de commanditaire à ton nom.</p>}
          <button className="adm-link-btn" onClick={() => aller("commandites")}>Voir les commanditaires →</button>
        </div>
      </div>
    </section>
  );
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
      {perso}
      <h2 className="adm-section">Le club en un coup d’œil</h2>
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
type FilProps = { email: string; comptes: Comptes; setComptes: React.Dispatch<React.SetStateAction<Comptes>> };
function Taches({ items, setItems, email, comptes, setComptes }: { items: Tache[]; setItems: React.Dispatch<React.SetStateAction<Tache[]>> } & FilProps) {
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
                  <Bulle n={comptes[`taches:${x.id}`]} />
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
          {edit.id && <Fil objet="taches" id={edit.id} email={email} setComptes={setComptes} />}
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
function Commandites({ items, setItems, email, comptes, setComptes }: { items: Commandite[]; setItems: React.Dispatch<React.SetStateAction<Commandite[]>> } & FilProps) {
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
                  <td><b>{c.entreprise}</b> <Bulle n={comptes[`commandites:${c.id}`]} />{c.contact && <small>{c.contact}</small>}</td>
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
          {edit.id && <Fil objet="commandites" id={edit.id} email={email} setComptes={setComptes} />}
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

/* ---------------- Calendrier (Google Agenda + échéances + relances) ---------------- */
type AgendaEv = { uid: string; titre: string; debut: string; fin?: string; journee: boolean; lieu?: string; description?: string };
type Item = { cle: string; jour: string; heure?: string; titre: string; type: "agenda" | "tache" | "relance"; detail?: string; onClick?: () => void };
const MOIS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

function Calendrier({ taches, comm, aller }: { taches: Tache[]; comm: Commandite[]; aller: (o: Onglet) => void }) {
  const [ag, setAg] = useState<{ items: AgendaEv[]; configure: boolean } | null>(null);
  const [mois, setMois] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [choix, setChoix] = useState<Item | null>(null);
  useEffect(() => { api<{ items: AgendaEv[]; configure: boolean }>("/api/admin/agenda").then(setAg).catch(() => setAg({ items: [], configure: true })); }, []);
  const loc = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const items: Item[] = ([
    ...(ag?.items ?? []).map((e): Item => {
      const jour = e.journee ? e.debut.slice(0, 10) : loc(e.debut);
      const heure = e.journee ? undefined : new Date(e.debut).toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" });
      return { cle: "a" + e.uid, jour, heure, titre: e.titre, type: "agenda" as const, detail: [e.lieu, e.description].filter(Boolean).join(" · ") };
    }),
    ...taches.filter((t) => t.echeance && t.statut !== "fait").map((t) => ({ cle: "t" + t.id, jour: t.echeance!, titre: t.titre, type: "tache" as const, detail: t.responsable ? `Échéance · ${t.responsable}` : "Échéance", onClick: () => aller("taches") })),
    ...comm.filter((c) => c.prochaine_date && !["refuse", "logo_recu"].includes(c.statut)).map((c) => ({ cle: "c" + c.id, jour: c.prochaine_date!, titre: `${c.prochaine_action || "Relance"} · ${c.entreprise}`, type: "relance" as const, detail: c.responsable, onClick: () => aller("commandites") })),
  ] as Item[]).sort((a, b) => (a.jour + (a.heure ?? "")).localeCompare(b.jour + (b.heure ?? "")));

  const premier = new Date(mois); premier.setDate(1 - premier.getDay()); // grille commence un dimanche
  const cases = Array.from({ length: 42 }, (_, i) => { const d = new Date(premier); d.setDate(premier.getDate() + i); return d; });
  const tj = today();
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const aVenir = items.filter((x) => x.jour >= tj).slice(0, 12);

  return (
    <>
      <div className="adm-bar-top">
        <h1>Calendrier</h1>
        <div className="adm-actions">
          <span className="adm-legend"><i className="lg-agenda" />Agenda du club <i className="lg-tache" />Tâches <i className="lg-relance" />Relances</span>
          <a className="adm-btn line" href="https://calendar.google.com/" target="_blank" rel="noopener">+ Événement (Google Agenda)</a>
        </div>
      </div>
      {ag && !ag.configure && <p className="adm-alert" style={{ background: "#FFF4DE", color: "#7A4B00" }}>L’agenda Google n’est pas encore branché : ajoute le secret <b>GCAL_ICS_URL</b> dans Cloudflare. Les tâches et relances s’affichent déjà.</p>}
      <div className="adm-cal-wrap">
        <section className="adm-card adm-cal">
          <header>
            <button className="adm-btn line sm" onClick={() => setMois(new Date(mois.getFullYear(), mois.getMonth() - 1, 1))} aria-label="Mois précédent">←</button>
            <h2>{MOIS_FR[mois.getMonth()]} {mois.getFullYear()}</h2>
            <button className="adm-btn line sm" onClick={() => setMois(new Date(mois.getFullYear(), mois.getMonth() + 1, 1))} aria-label="Mois suivant">→</button>
            <button className="adm-btn line sm" onClick={() => { const d = new Date(); setMois(new Date(d.getFullYear(), d.getMonth(), 1)); }}>Aujourd’hui</button>
          </header>
          <div className="adm-cal-grid">
            {["dim", "lun", "mar", "mer", "jeu", "ven", "sam"].map((j) => <div key={j} className="adm-cal-dow">{j}</div>)}
            {cases.map((d) => {
              const k = iso(d);
              const du = items.filter((x) => x.jour === k);
              return (
                <div key={k} className={"adm-cal-day" + (d.getMonth() !== mois.getMonth() ? " autre" : "") + (k === tj ? " auj" : "")}>
                  <span className="n">{d.getDate()}</span>
                  {du.slice(0, 3).map((x) => (
                    <button key={x.cle} className={"adm-ev ev-" + x.type + (x.type !== "agenda" && x.jour < tj ? " late" : "")} onClick={() => setChoix(x)} title={x.titre}>
                      {x.heure && <b>{x.heure}</b>}{x.titre}
                    </button>
                  ))}
                  {du.length > 3 && <span className="adm-more">+{du.length - 3}</span>}
                </div>
              );
            })}
          </div>
        </section>
        <aside className="adm-card adm-upcoming">
          <h2>À venir</h2>
          {ag === null && <p className="adm-muted">Chargement de l’agenda…</p>}
          {aVenir.map((x) => (
            <button key={x.cle} className="adm-up" onClick={() => setChoix(x)}>
              <span className={"dot ev-" + x.type} />
              <span className="adm-date">{dateFr(x.jour)}{x.heure ? ` · ${x.heure}` : ""}</span>
              <span className="ti">{x.titre}</span>
            </button>
          ))}
          {ag && !aVenir.length && <p className="adm-muted">Rien de prévu.</p>}
        </aside>
      </div>
      {choix && (
        <Tiroir titre={choix.type === "agenda" ? "Événement" : choix.type === "tache" ? "Échéance" : "Relance"} fermer={() => setChoix(null)}>
          <div className="adm-form">
            <p className="adm-date">{new Date(choix.jour + "T12:00:00").toLocaleDateString("fr-CA", { weekday: "long", day: "numeric", month: "long" })}{choix.heure ? ` · ${choix.heure}` : ""}</p>
            <h3 style={{ font: "italic 800 26px/1.1 var(--ft)", textTransform: "uppercase", color: "var(--navy)" }}>{choix.titre}</h3>
            {choix.detail && <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{choix.detail}</p>}
            <div className="adm-form-actions">
              {choix.onClick ? <button className="adm-btn" onClick={() => { setChoix(null); choix.onClick!(); }}>Ouvrir {choix.type === "tache" ? "les tâches" : "les commanditaires"}</button>
                : <a className="adm-btn" href="https://calendar.google.com/" target="_blank" rel="noopener">Ouvrir Google Agenda</a>}
            </div>
          </div>
        </Tiroir>
      )}
    </>
  );
}

/* ---------------- Boutique (stock du Sheet + réservations) ---------------- */
function Boutique({ items, setItems }: { items: Soumission[]; setItems: React.Dispatch<React.SetStateAction<Soumission[]>> }) {
  const [stock, setStock] = useState<{ coupe: string; taille: string; n: number }[] | null>(null);
  const [vue, setVue] = useState("actives");
  useEffect(() => {
    fetch(STOCK_CSV, { cache: "no-store" }).then((r) => r.text()).then((csv) => {
      const rows: { coupe: string; taille: string; n: number }[] = [];
      csv.split(/\r?\n/).forEach((l) => {
        const [k, v] = l.split(",").map((x) => x.trim());
        const m = k?.match(/^T_\d+_([^_]+)_(.+)$/i);
        if (m && Number.isFinite(Number(v))) rows.push({ coupe: m[1].toLowerCase(), taille: m[2].toUpperCase(), n: Number(v) });
      });
      setStock(rows);
    }).catch(() => setStock([]));
  }, []);
  const res = items.filter((s) => s.type === "precommande").map((s) => {
    let d: Record<string, string> = {};
    try { d = JSON.parse(s.donnees); } catch {}
    const q = Number(d.quantite) || 1;
    const total = Number(String(d.total ?? "").replace(/[^\d.]/g, "")) || q * PRIX_TSHIRT;
    return { s, d, q, total };
  });
  const enAttente = (coupe: string, taille: string) => res.filter((r) => r.s.statut !== "remis" && r.s.statut !== "annule" && (r.d.taille ?? "").toLowerCase() === `${coupe} ${taille}`.toLowerCase()).reduce((a, r) => a + r.q, 0);
  const aEncaisser = res.filter((r) => r.s.statut === "nouveau").reduce((a, r) => a + r.total, 0);
  const encaisse = res.filter((r) => ["paye", "remis"].includes(r.s.statut)).reduce((a, r) => a + r.total, 0);
  const liste = res.filter((r) => vue === "actives" ? ["nouveau", "paye"].includes(r.s.statut) : vue === "toutes" ? true : r.s.statut === vue);
  async function etape(s: Soumission, statut: string) {
    setItems((x) => x.map((y) => (y.id === s.id ? { ...y, statut } : y)));
    await api(`/api/admin/soumissions/${s.id}`, { method: "PATCH", body: JSON.stringify({ statut }) });
  }
  const coupes = stock ? [...new Set(stock.map((x) => x.coupe))] : [];
  return (
    <>
      <div className="adm-bar-top">
        <h1>Boutique · T-shirt 2026</h1>
        <div className="adm-actions">
          <span className="adm-total">À encaisser : <b>{aEncaisser} $</b></span>
          <span className="adm-total">Encaissé : <b>{encaisse} $</b></span>
          <a className="adm-btn line" href={STOCK_SHEET} target="_blank" rel="noopener">Modifier le stock (Sheet)</a>
        </div>
      </div>
      <section className="adm-card" style={{ marginBottom: 14 }}>
        <h2>Stock</h2>
        {stock === null ? <p className="adm-muted">Lecture du Google Sheet…</p> : !stock.length ? <p className="adm-muted">Impossible de lire le Sheet.</p> : (
          <div className="adm-stock">
            {coupes.map((c) => (
              <div key={c}>
                <p className="adm-stock-h">{c}</p>
                <div className="adm-stock-row">
                  {stock.filter((x) => x.coupe === c).map((x) => {
                    const att = enAttente(c, x.taille);
                    return (
                      <div key={x.taille} className={"adm-size" + (x.n === 0 ? " out" : x.n - att <= 1 ? " low" : "")} title={att ? `${att} réservé(s) non remis` : ""}>
                        <b>{x.taille}</b><span>{x.n}</span>{att > 0 && <small>{att} réservé{att > 1 ? "s" : ""}</small>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="adm-muted" style={{ marginTop: 10 }}>Le stock vient du Google Sheet (mis à jour sur le site en ~5 min). « Réservés » = réservations pas encore remises : baisse le stock dans le Sheet quand le t-shirt est remis.</p>
      </section>
      <div className="adm-steps">
        {[["actives", "En cours"], ...ETAPES_RES.map((e) => [e.k, e.label]), ["toutes", "Toutes"]].map(([k, l]) => (
          <button key={k} className={vue === k ? "on" : ""} onClick={() => setVue(k)}>{l} <i>{k === "actives" ? res.filter((r) => ["nouveau", "paye"].includes(r.s.statut)).length : k === "toutes" ? res.length : res.filter((r) => r.s.statut === k).length}</i></button>
        ))}
      </div>
      {liste.length === 0 ? <p className="adm-empty">Aucune réservation ici. Les réservations faites sur le site arrivent automatiquement.</p> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Nom</th><th>Taille</th><th>Qté</th><th>Total</th><th>Reçue</th><th>Étape</th></tr></thead>
            <tbody>
              {liste.map(({ s, d, q, total }) => (
                <tr key={s.id} style={{ cursor: "default" }}>
                  <td><b>{d.nom}</b>{d.courriel && <small><a href={`mailto:${d.courriel}`}>{d.courriel}</a></small>}{d.telephone && <small>{d.telephone}</small>}</td>
                  <td>{d.taille}</td><td>{q}</td><td>{total} $</td><td>{dateFr(s.recu_le)}</td>
                  <td><select className={"adm-stage r-" + s.statut} value={s.statut} onChange={(e) => etape(s, e.target.value)}>{ETAPES_RES.map((e) => <option key={e.k} value={e.k}>{e.label}</option>)}</select></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
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

/* ---------------- Commentaires ---------------- */
function Bulle({ n }: { n?: number }) {
  if (!n) return null;
  return (
    <span className="adm-bulle" title={`${n} commentaire${n > 1 ? "s" : ""}`}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></svg>{n}
    </span>
  );
}

function Fil({ objet, id, email, setComptes }: { objet: "taches" | "commandites"; id: number; email: string; setComptes: React.Dispatch<React.SetStateAction<Comptes>> }) {
  const [items, setItems] = useState<Commentaire[] | null>(null);
  const [texte, setTexte] = useState("");
  const [envoi, setEnvoi] = useState(false);
  useEffect(() => {
    api<{ items: Commentaire[] }>(`/api/admin/commentaires?objet=${objet}&id=${id}`).then((r) => setItems(r.items)).catch(() => setItems([]));
  }, [objet, id]);
  const cle = `${objet}:${id}`;
  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!texte.trim()) return;
    setEnvoi(true);
    try {
      const r = await api<{ item: Commentaire }>("/api/admin/commentaires", { method: "POST", body: JSON.stringify({ objet, objet_id: id, texte }) });
      setItems((x) => [...(x ?? []), r.item]); setTexte("");
      setComptes((c) => ({ ...c, [cle]: (c[cle] ?? 0) + 1 }));
    } catch (er) { alert((er as Error).message); }
    setEnvoi(false);
  }
  async function supprimer(c: Commentaire) {
    if (!confirm("Supprimer ce commentaire ?")) return;
    await api(`/api/admin/commentaires/${c.id}`, { method: "DELETE" });
    setItems((x) => (x ?? []).filter((y) => y.id !== c.id));
    setComptes((k) => ({ ...k, [cle]: Math.max(0, (k[cle] ?? 1) - 1) }));
  }
  return (
    <section className="adm-fil">
      <h3>Commentaires {items && items.length > 0 && <span>{items.length}</span>}</h3>
      {items === null ? <p className="adm-muted">Chargement…</p> : items.length === 0 ? <p className="adm-muted">Aucun commentaire pour l’instant.</p> : (
        <ol>
          {items.map((c) => (
            <li key={c.id} className={c.auteur === email ? "moi" : ""}>
              <div className="adm-avatar" aria-hidden="true">{nom(c.auteur).slice(0, 1)}</div>
              <div>
                <p className="adm-meta"><b>{nom(c.auteur)}</b> · {quand(c.cree_le)}
                  {c.auteur === email && <button onClick={() => supprimer(c)} aria-label="Supprimer">Supprimer</button>}</p>
                <p className="adm-txt">{c.texte}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
      <form onSubmit={envoyer} className="adm-fil-form">
        <textarea value={texte} onChange={(e) => setTexte(e.target.value)} rows={2} placeholder="Écrire un commentaire…"
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) envoyer(e); }} />
        <button className="adm-btn sm" disabled={envoi || !texte.trim()}>{envoi ? "…" : "Envoyer"}</button>
      </form>
    </section>
  );
}

function quand(iso: string) {
  const d = new Date(iso.replace(" ", "T") + "Z");
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 1) return "à l’instant";
  if (min < 60) return `il y a ${min} min`;
  if (min < 60 * 24) return `il y a ${Math.round(min / 60)} h`;
  return d.toLocaleDateString("fr-CA", { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" });
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
