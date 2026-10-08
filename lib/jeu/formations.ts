// Formations de départ (repères World Rugby, lois 12, 18 et 19). Schémas à adapter par le coach.
import { formation, type Phase, type Player } from "./playbook";
export const formationIds = ["open", "lineout5", "lineout7", "scrum", "scrum-left", "kickoff", "receive"] as const;
export type FormationId = (typeof formationIds)[number];
export type FormationTemplate = {
  id: FormationId;
  label: string;
  description: string;
  category: string;
  group: string;
  note: string;
  source?: string;
};
export const formationTemplates: FormationTemplate[] = [
  {
    id: "lineout5",
    label: "Touche à 5",
    description: "Un alignement court et deux avants disponibles au large.",
    category: "Conquête",
    group: "TOUCHE / LINEOUT",
    note: "Les 1, 4, 3, 5 et 6 forment l’alignement. Le 2 lance ; le 9 attend comme relayeur. Les non-participants restent à 10 m de la ligne de remise en jeu.",
    source: "https://passport.world.rugby/laws-of-the-game/laws-by-number/18-touch-quick-throw-and-lineout/",
  },
  {
    id: "lineout7",
    label: "Touche à 7",
    description: "Un alignement complet avec plusieurs cibles possibles.",
    category: "Conquête",
    group: "TOUCHE / LINEOUT",
    note: "Les 1, 4, 3, 6, 5, 7 et 8 forment l’alignement entre les lignes des 5 et 15 m. Le 2 lance ; le 9 assure le relais. Les arrières attendent à 10 m.",
    source: "https://passport.world.rugby/laws-of-the-game/laws-by-number/18-touch-quick-throw-and-lineout/",
  },
  {
    id: "scrum",
    label: "Mêlée au centre",
    description: "Deux packs de huit, avec des options de chaque côté.",
    category: "Conquête",
    group: "MÊLÉE",
    note: "Les huit avants se placent dans la mêlée. Le 9 introduit. Les non-participants attendent au moins 5 m derrière le dernier pied de leur mêlée. Le coach annonce la sortie.",
    source: "https://passport.world.rugby/laws-of-the-game/laws-by-number/19-scrum/",
  },
  {
    id: "scrum-left",
    label: "Mêlée côté gauche",
    description: "Un côté fermé court et un grand côté pour attaquer.",
    category: "Conquête",
    group: "MÊLÉE",
    note: "Mêlée côté gauche de l’attaque. Le 9 introduit ; les arrières se répartissent vers le grand côté et restent 5 m derrière le dernier pied. Adapter l’appel au placement défensif.",
    source: "https://passport.world.rugby/laws-of-the-game/laws-by-number/19-scrum/",
  },
  {
    id: "kickoff",
    label: "Botté d’envoi",
    description: "Le botteur au centre, les chasseurs derrière le ballon.",
    category: "Attaque",
    group: "COUP D’ENVOI",
    note: "Le 10 effectue le botté tombé au centre ou derrière la médiane. Ses partenaires restent derrière le ballon au moment du coup de pied. Les adversaires attendent à 10 m ; le ballon doit atteindre leur ligne des 10 m.",
    source: "https://passport.world.rugby/laws-of-the-game/laws-by-number/12-kick-off-and-restart-kicks/",
  },
  {
    id: "receive",
    label: "Réception de l’envoi",
    description: "Des réceptionneurs répartis, avec du soutien en profondeur.",
    category: "Relance",
    group: "COUP D’ENVOI",
    note: "Les Barracudas reçoivent et attendent sur ou derrière leur ligne des 10 m. Annoncer la réception, identifier les soutiens proches, puis choisir la sortie selon l’espace.",
    source: "https://passport.world.rugby/laws-of-the-game/laws-by-number/12-kick-off-and-restart-kicks/",
  },
  {
    id: "open",
    label: "Jeu ouvert",
    description: "Un placement libre pour construire votre propre organisation.",
    category: "Attaque",
    group: "LIBRE",
    note: "Le coach définit le point de départ du ballon, les courses et les soutiens.",
  },
];
export function getFormation(id: FormationId) {
  return formationTemplates.find((t) => t.id === id)!;
}
// Les phases arrêtées (mêlée, touche) sont dessinées en schéma, pas à l'échelle : tous les joueurs ont la même taille
// et restent lisibles sur le terrain entier. Plus de vue rapprochée.
export function canZoomSetup(_setup?: string) {
  return false;
}
export function setupCamera(_setup?: string) {
  return { x: 0, y: 0, w: 1000, h: 600 };
}
const lineoutOrder = [1, 4, 3, 6, 5, 7, 8];
export function lineoutNumbers(id: FormationId) {
  return id === "lineout5" ? [1, 4, 3, 5, 6] : lineoutOrder;
}
function playersFrom(home: number[][], away?: number[][]): Player[] {
  return [
    ...home.map(([x, y], i) => ({ id: i + 1, x, y, team: "home" as const })),
    ...(away || home.map(([x, y]) => [1000 - x, y])).map(([x, y], i) => ({ id: i + 1, x, y, team: "away" as const })),
  ];
}
export function createFormationPhase(id: FormationId): Phase {
  const info = getFormation(id);
  if (!info) throw new Error("Formation inconnue.");
  let players: Player[] = formation();
  let ball = { x: 435, y: 318 };
  const roles = Object.fromEntries(
    Array.from({ length: 15 }, (_, i) => [
      String(i + 1),
      "Se placer selon le schéma, confirmer son rôle avec le coach et rester disponible en soutien.",
    ]),
  );
  if (id.startsWith("lineout")) {
    const order = lineoutNumbers(id);
    const fin = 110 + (order.length - 1) * 40;
    // Arrières à 10 m (schéma) : ligne en diagonale, ailier fermé près de la touche.
    const home: number[][] = Array.from({ length: 15 }, () => [300, 300]);
    const pos: Record<number, number[]> = { 10: [360, 200], 11: [380, 80], 12: [320, 270], 13: [285, 340], 14: [250, 420], 15: [200, 300] };
    if (id === "lineout5") { pos[7] = [400, 340]; pos[8] = [400, 400]; }
    for (const [n, xy] of Object.entries(pos)) home[Number(n) - 1] = xy;
    order.forEach((n, i) => {
      home[n - 1] = [480, 110 + i * 40];
      roles[String(n)] =
        `Prendre la place ${i + 1} dans l’alignement. Confirmer la cible et le rôle de sauteur ou de soutien annoncés par le coach.`;
    });
    home[1] = [500, 40];
    home[8] = [425, Math.round((110 + fin) / 2)];
    const away = home.map(([x, y]) => [1000 - x, y]);
    away[1] = [550, 75];
    ball = { x: 515, y: 40 };
    players = playersFrom(home, away);
    roles["2"] = "Annoncer la combinaison et lancer depuis la touche vers la cible convenue.";
    roles["9"] = "Attendre à 2 m de l’alignement comme relayeur, recevoir et connecter le 10.";
    [10, 11, 12, 13, 14, 15, ...(id === "lineout5" ? [7, 8] : [])].forEach(
      (n) =>
        (roles[String(n)] =
          "Attendre à au moins 10 m de la ligne de remise en jeu. Conserver la profondeur et se rendre disponible à la sortie."),
    );
  } else if (id.startsWith("scrum")) {
    const y = id === "scrum-left" ? 190 : 300;
    const home = [
      [478, y - 38],
      [478, y],
      [478, y + 38],
      [440, y - 19],
      [440, y + 19],
      [440, y - 57],
      [440, y + 57],
      [402, y],
      [470, y - 105],
      [360, y - 40],
      [370, 70],
      [330, y + 40],
      [295, y + 110],
      [255, Math.min(520, y + 190)],
      [210, y + 20],
    ];
    players = playersFrom(
      home,
      home.map(([x, py], i) => [1000 - x, i < 8 ? 2 * y - py : py]),
    );
    ball = { x: 492, y: y - 92 };
    const jobs = [
      "Se lier avec le talonneur dans la première ligne gauche.",
      "Se placer entre les piliers et coordonner la conquête.",
      "Se lier avec le talonneur dans la première ligne droite.",
      "Se lier derrière la première ligne, côté gauche.",
      "Se lier derrière la première ligne, côté droit.",
      "Se lier au pack et préparer le soutien côté gauche.",
      "Se lier au pack et préparer le soutien côté droit.",
      "Contrôler la sortie à l’arrière et communiquer avec le 9.",
      "Introduire sur l’annonce puis organiser la sortie du ballon.",
    ];
    jobs.forEach((r, i) => (roles[String(i + 1)] = r));
    for (let n = 10; n <= 15; n++)
      roles[String(n)] =
        "Attendre au moins 5 m derrière le dernier pied de la mêlée. Garder la profondeur et confirmer le lancement avec le 10.";
  } else if (id === "kickoff" || id === "receive") {
    const home = Array.from({ length: 15 }, (_, i) => [i === 14 ? 395 : 470 - (i % 3) * 14, 75 + (i % 14) * 34]);
    home[9] = [500, 300];
    home[14] = [370, 300];
    const away = Array.from({ length: 15 }, (_, i) => [i < 8 ? 610 + (i % 2) * 35 : i < 14 ? 720 : 820, 80 + (i % 7) * 70]);
    away[14] = [820, 300];
    players =
      id === "kickoff"
        ? playersFrom(home, away)
        : playersFrom(
            away.map(([x, y]) => [1000 - x, y]),
            home.map(([x, y]) => [1000 - x, y]),
          );
    ball = { x: 500, y: 288 };
    for (let n = 1; n <= 15; n++)
      roles[String(n)] =
        id === "kickoff"
          ? n === 10
            ? "Annoncer la zone visée et effectuer le botté tombé depuis le centre."
            : "Rester derrière le ballon jusqu’au botté, puis avancer dans son couloir avec les partenaires."
          : n === 15
            ? "Observer la trajectoire, annoncer la réception et organiser la couverture profonde."
            : "Attendre derrière la ligne des 10 m, annoncer la réception ou se proposer en soutien du réceptionneur.";
  }
  return { id: crypto.randomUUID(), name: info.label, note: info.note, players, trails: [], ball, roles, setup: id };
}
// Replacing a placement never discards written instructions or changes other phases.
/** Anciennes phases arrêtées dessinées à l'échelle (joueurs collés) → schéma lisible. */
export function normaliserPhase(p: Phase): Phase {
  if (!p.setup || !(p.setup.startsWith("lineout") || p.setup.startsWith("scrum"))) return p;
  const avants = p.players.filter((j) => j.team === "home" && j.id <= 8);
  let min = Infinity;
  for (const a of avants) for (const b of avants) if (a !== b) min = Math.min(min, Math.hypot(a.x - b.x, a.y - b.y));
  if (min >= 20) return p;
  const t = createFormationPhase(p.setup as FormationId);
  return { ...p, players: t.players, ball: t.ball };
}
export function replacePhasePlacement(current: Phase, id: FormationId): Phase {
  const template = createFormationPhase(id);
  return { ...current, players: template.players, ball: template.ball, trails: [], setup: id };
}
