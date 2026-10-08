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
export function canZoomSetup(setup?: string) {
  return !!setup && (setup.startsWith("lineout") || setup.startsWith("scrum"));
}
export function setupCamera(setup?: string) {
  if (setup?.startsWith("lineout")) return { x: 410, y: 20, w: 180, h: 150 };
  if (setup?.startsWith("scrum")) return { x: 400, y: setup === "scrum-left" ? 100 : 220, w: 200, h: 160 };
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
    const home = Array.from({ length: 15 }, (_, i) => [400 - Math.floor(i / 5) * 35, 220 + (i % 5) * 65]);
    const away = home.map(([x, y]) => [1000 - x, y]);
    order.forEach((n, i) => {
      const y = 90 + (i * 64) / (order.length - 1);
      home[n - 1] = [496, y];
      away[n - 1] = [504, y];
      roles[String(n)] =
        `Prendre la place ${i + 1} dans l’alignement. Confirmer la cible et le rôle de sauteur ou de soutien annoncés par le coach.`;
    });
    home[1] = [500, 42];
    away[1] = [516, 71];
    home[8] = [480, 143];
    away[8] = [520, 143];
    ball = { x: 500, y: 31 };
    players = playersFrom(home, away);
    roles["2"] = "Annoncer la combinaison et lancer depuis la touche vers la cible convenue.";
    roles["9"] = "Attendre à 2 m de l’alignement comme relayeur, recevoir et connecter le 10.";
    [10, 11, 12, 13, 14, 15, ...(id === "lineout5" ? [7, 8] : [])].forEach(
      (n) =>
        (roles[String(n)] =
          "Attendre à au moins 10 m de la ligne de remise en jeu. Conserver la profondeur et se rendre disponible à la sortie."),
    );
  } else if (id.startsWith("scrum")) {
    const y = id === "scrum-left" ? 180 : 300;
    const home = [
      [493, y - 19],
      [493, y],
      [493, y + 19],
      [478, y - 10],
      [478, y + 10],
      [478, y - 29],
      [478, y + 29],
      [461, y],
      [497, y - 52],
      [385, 260],
      [355, 80],
      [365, 335],
      [340, 410],
      [300, 510],
      [240, 300],
    ];
    if (id === "scrum-left") {
      home[9] = [385, 280];
      home[11] = [365, 345];
      home[12] = [345, 410];
    }
    players = playersFrom(
      home,
      home.map(([x, py], i) => [1000 - x, i < 8 ? 2 * y - py : py]),
    );
    ball = { x: 500, y: y - 42 };
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
export function replacePhasePlacement(current: Phase, id: FormationId): Phase {
  const template = createFormationPhase(id);
  return { ...current, players: template.players, ball: template.ball, trails: [], setup: id };
}
