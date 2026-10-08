"use client";
// Pièces communes de l'admin : appels API, noms, commentaires, tiroir.
import { useEffect, useState } from "react";

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j as { error?: string }).error || `Erreur ${r.status}`);
  return j as T;
}

export const NOMS: Record<string, string> = { "guillaume.perron": "Guillaume", info: "Jean", commandites: "Clément", technique: "Christophe", tresorier: "Marc-André", secretaire: "Gabriel" };
export const nom = (email: string) => NOMS[email.split("@")[0]] ?? email.split("@")[0];
export type Commentaire = { id: number; objet: string; objet_id: number; auteur: string; texte: string; cree_le: string };
export type Comptes = Record<string, number>;

export function Bulle({ n }: { n?: number }) {
  if (!n) return null;
  return (
    <span className="adm-bulle" title={`${n} commentaire${n > 1 ? "s" : ""}`}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></svg>{n}
    </span>
  );
}

export function Fil({ objet, id, email, setComptes }: { objet: "taches" | "commandites" | "jeux"; id: number; email: string; setComptes: React.Dispatch<React.SetStateAction<Comptes>> }) {
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

export function quand(iso: string) {
  const d = new Date(iso.replace(" ", "T") + "Z");
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 1) return "à l’instant";
  if (min < 60) return `il y a ${min} min`;
  if (min < 60 * 24) return `il y a ${Math.round(min / 60)} h`;
  return d.toLocaleDateString("fr-CA", { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" });
}

/* ---------------- Tiroir (panneau latéral) ---------------- */
export function Tiroir({ titre, fermer, children }: { titre: string; fermer: () => void; children: React.ReactNode }) {
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
