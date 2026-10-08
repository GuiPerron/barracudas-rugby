// Système de jeu : la structure d'attaque de l'équipe (ex. 1-4-4-1) — des groupes de joueurs (« pods »)
// répartis sur la largeur du terrain, et les joueurs placés derrière (distributeurs, arrière).
import { formation, newPhase, type Phase, type Player } from "./playbook";

export type Systeme = {
  id: string;
  nom: string;
  /** Joueurs de chaque pod, du bord gauche au bord droit (numéros 1 à 15). */
  pods: number[][];
  /** Rôle court de chaque pod (même ordre que pods). */
  rolesPods: string[];
  note: string;
  /** Placement ajusté à la main ; null = placement automatique. */
  placement: Player[] | null;
};

export const STRUCTURES = ["1-3-3-1", "2-4-2", "1-4-4-1", "2-3-3", "3-3-2"];
const ORDRE = [1, 2, 3, 6, 4, 5, 7, 8, 12, 13, 11, 14, 15, 10, 9];

export const structureDe = (s: Pick<Systeme, "pods">) => s.pods.map((p) => p.length).join("-");
export const derriere = (s: Pick<Systeme, "pods">) => {
  const dans = new Set(s.pods.flat());
  return Array.from({ length: 15 }, (_, i) => i + 1).filter((n) => !dans.has(n));
};

/** Répartition de départ pour une structure « 1-4-4-1 » : à ajuster par le coach. */
export function podsPour(structure: string): number[][] {
  const tailles = structure.split("-").map((x) => Math.max(1, Math.min(6, Number(x) || 1))).slice(0, 8);
  const total = tailles.reduce((a, b) => a + b, 0);
  const restants = [...ORDRE];
  const pods: number[][] = tailles.map(() => []);
  // Au-delà des 8 avants, les pods d'un joueur aux bords reviennent aux ailiers.
  if (total > 8 && tailles.length > 1) {
    if (tailles[0] === 1) { pods[0] = [11]; restants.splice(restants.indexOf(11), 1); }
    if (tailles.at(-1) === 1) { pods[tailles.length - 1] = [14]; restants.splice(restants.indexOf(14), 1); }
  }
  tailles.forEach((t, i) => { while (pods[i].length < t && restants.length) pods[i].push(restants.shift()!); });
  return pods.map((p) => p.sort((a, b) => a - b));
}

export function nouveauSysteme(structure = "1-4-4-1"): Systeme {
  const pods = podsPour(structure);
  return { id: crypto.randomUUID(), nom: `Notre système ${structure}`, pods, rolesPods: pods.map(() => ""), note: "", placement: null };
}

/** Placement automatique : pods répartis sur la largeur, joueurs « derrière » en deuxième rideau. */
export function placementAuto(s: Pick<Systeme, "pods">): Player[] {
  const n = s.pods.length || 1;
  const joueurs: Player[] = [];
  const centres = s.pods.map((_, k) => 85 + ((k + 0.5) * 430) / n);
  s.pods.forEach((pod, k) => {
    // Pod en blocs de deux de front (même écart que la taille des jetons, pour que rien ne se chevauche).
    pod.forEach((num, j) => {
      const seul = pod.length % 2 === 1 && j === pod.length - 1;
      const dy = seul ? 0 : (j % 2 === 0 ? -20 : 20);
      const rang = Math.floor(j / 2);
      joueurs.push({ id: num, team: "home", x: 565 - rang * 40, y: Math.round(centres[k] + (pod.length === 1 ? 0 : dy)) });
    });
  });
  const autres = derriere(s);
  const distrib = autres.filter((x) => x !== 15);
  distrib.forEach((num, i) => {
    joueurs.push({ id: num, team: "home", x: num === 9 ? 465 : 405, y: Math.round(115 + ((i + 0.5) * 370) / Math.max(1, distrib.length)) });
  });
  if (autres.includes(15)) joueurs.push({ id: 15, team: "home", x: 320, y: 300 });
  return joueurs;
}

export const placementDe = (s: Systeme) => s.placement ?? placementAuto(s);

/** Phase de terrain pour afficher le système (sans adversaires). */
export function phaseDuSysteme(s: Systeme): Phase {
  const joueurs = placementDe(s);
  const neuf = joueurs.find((p) => p.id === 9);
  return { ...newPhase(), id: `sys-${s.id}`, name: s.nom, note: s.note, players: joueurs, trails: [], ball: neuf ? { x: neuf.x + 14, y: neuf.y + 10 } : { x: 520, y: 300 } };
}

/** Phase de jeu qui part du système (avec une défense alignée), pour le tableau tactique. */
export function phaseDepuisSysteme(s: Systeme): Phase {
  const base = phaseDuSysteme(s);
  const defense = formation("XV").filter((p) => p.team === "away").map((p, i) => ({ ...p, x: 640, y: 80 + i * 32 }));
  return { ...base, id: crypto.randomUUID(), players: [...base.players, ...defense] };
}
