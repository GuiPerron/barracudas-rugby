// Modèle de données du cahier de jeu (adapté de l’outil « barracudas-playbook »).
export type Player = { id: number; x: number; y: number; team: "home" | "away" };
export type Trail = { id: string; x1: number; y1: number; x2: number; y2: number; type: "run" | "pass" | "kick" };
export type Annotation = { id: string; x: number; y: number; texte: string };
export type Phase = {
  setup?: string;
  id: string;
  name: string;
  note: string;
  players: Player[];
  trails: Trail[];
  ball: { x: number; y: number };
  roles: Record<string, string>;
  /** Annotations écrites sur le terrain. */
  notes?: Annotation[];
};
export type Play = {
  id: string;
  title: string;
  category: string;
  format: "XV" | "7";
  status: "draft" | "published";
  summary: string;
  phases: Phase[];
  updatedAt: string;
  example?: boolean;
  version?: number;
};
export type Member = { id: string; name: string; email: string; role: "coach" | "player"; position: number };
export type Principle = { id: string; title: string; text: string };
export type State = {
  plays: Play[];
  principles: Principle[];
  members: Member[];
  role: "coach" | "player";
  user: { name: string; email: string };
  revision: number;
};
export const positions = [
  "Pilier gauche",
  "Talonneur",
  "Pilier droit",
  "Deuxième ligne",
  "Deuxième ligne",
  "Troisième ligne aile",
  "Troisième ligne aile",
  "Troisième ligne centre",
  "Demi de mêlée",
  "Demi d’ouverture",
  "Ailier gauche",
  "Premier centre",
  "Deuxième centre",
  "Ailier droit",
  "Arrière",
];
export const categories = ["Tous les jeux", "Attaque", "Défense", "Conquête", "Relance"];
export function formation(format: "XV" | "7" = "XV"): Player[] {
  const xy = [
    [385, 370],
    [385, 400],
    [385, 430],
    [350, 380],
    [350, 420],
    [315, 355],
    [315, 445],
    [310, 400],
    [410, 315],
    [350, 250],
    [190, 100],
    [310, 200],
    [265, 150],
    [240, 505],
    [160, 315],
  ];
  return [
    ...xy.slice(0, format === "XV" ? 15 : 7).map(([x, y], i) => ({ id: i + 1, x, y, team: "home" as const })),
    ...xy.slice(0, format === "XV" ? 15 : 7).map(([x, y], i) => ({ id: i + 1, x: 1000 - x, y, team: "away" as const })),
  ];
}
export function newPhase(format: "XV" | "7" = "XV"): Phase {
  return {
    id: crypto.randomUUID(),
    name: "Placement",
    note: "",
    players: formation(format),
    trails: [],
    ball: { x: 435, y: 318 },
    roles: Object.fromEntries(positions.slice(0, format === "XV" ? 15 : 7).map((_, i) => [String(i + 1), ""])),
  };
}
const roles = [
  "Stabiliser la mêlée, puis se replacer dans l’axe du ballon.",
  "Conserver la liaison, puis offrir un soutien intérieur.",
  "Sécuriser la sortie et rejoindre la première zone de soutien.",
  "Rester lié jusqu’à la sortie, puis avancer dans l’axe.",
  "Se rendre disponible pour le deuxième temps de jeu.",
  "Protéger le côté fermé et suivre le porteur.",
  "Accélérer en soutien intérieur sans dépasser le ballon.",
  "Contrôler le ballon en sortie et communiquer avec le 9.",
  "Servir le 10 avec une passe précise, puis suivre à l’intérieur.",
  "Fixer le premier défenseur et annoncer le choix de passe.",
  "Garder la largeur et rester disponible sur l’aile opposée.",
  "Proposer une course droite pour fixer le défenseur intérieur.",
  "Attendre la fixation du 12 avant d’accélérer dans l’espace.",
  "Rester large, recevoir en mouvement et chercher le soutien.",
  "Suivre en profondeur pour proposer une solution de relance.",
];
function example(id: string, title: string, category: string, summary: string, names: string[]): Play {
  const phases = names.map((name, i) => ({
    id: `${id}-${i}`,
    name,
    note:
      [
        "Le 9 annonce le lancement. La ligne arrière conserve de la profondeur et chacun confirme son rôle.",
        "Le porteur fixe avant de transmettre. Les soutiens restent derrière le ballon et communiquent.",
        "Exploiter l’espace disponible. Si la défense ferme, conserver le ballon et reformer les soutiens.",
      ][i] || "Reformer le dispositif.",
    players: formation().map((p) => ({ ...p, x: p.team === "home" ? Math.min(860, p.x + i * (p.id > 8 ? 95 : 65)) : p.x + i * 45 })),
    trails:
      i === 0
        ? [
            { id: "run1", x1: 350, y1: 250, x2: 500, y2: 235, type: "run" as const },
            { id: "pass1", x1: 425, y1: 315, x2: 350, y2: 250, type: "pass" as const },
            { id: "run2", x1: 310, y1: 200, x2: 465, y2: 155, type: "run" as const },
            { id: "pass2", x1: 490, y1: 235, x2: 455, y2: 158, type: "pass" as const },
          ]
        : [],
    ball: { x: 435 + i * 80, y: 318 - i * 68 },
    roles: Object.fromEntries(
      roles.map((role, n) => [
        String(n + 1),
        i === 0
          ? role
          : `${role} ${i === 1 ? "Communiquer le replacement et maintenir la profondeur." : "Revenir disponible pour le prochain temps de jeu."}`,
      ]),
    ),
  }));
  return { id, title, category, format: "XV", status: "published", summary, phases, updatedAt: "2026-10-08", example: true, version: 0 };
}
export const examplePlays: Play[] = [
  example("eclair", "Éclair · sortie de mêlée", "Attaque", "Fixer au centre, créer le décalage et libérer l’aile.", [
    "Se mettre en place",
    "Fixer & décaler",
    "Jouer l’espace",
  ]),
  example("rideau", "Rideau · défense connectée", "Défense", "Avancer ensemble en gardant une connexion entre chaque défenseur.", [
    "Alignement",
    "Montée collective",
    "Reconnexion",
  ]),
  example("touche", "Orion · lancement en touche", "Conquête", "Sécuriser la conquête avant de lancer la ligne arrière.", [
    "Organisation",
    "Sortie de balle",
    "Lancement",
  ]),
  example("large", "Large · circulation du ballon", "Attaque", "Attirer la défense dans une zone avant de changer le point d’attaque.", [
    "Fixation",
    "Transfert",
    "Continuité",
  ]),
  example("retour", "Retour · relance du fond", "Relance", "Identifier l’espace et reconstruire les soutiens à la réception.", [
    "Réception",
    "Connexion",
    "Relance",
  ]),
  example("tempo", "Tempo · soutien axial", "Attaque", "Enchaîner les temps de jeu avec des soutiens proches et disponibles.", [
    "Organisation",
    "Soutien",
    "Replacement",
  ]),
];
// Examples are editable teaching templates, not an approved club game plan.
examplePlays[1].phases.forEach((p, i) => {
  p.players = formation().map((t) => ({
    ...t,
    x: t.team === "home" ? 410 + i * 65 + (t.id > 13 ? -160 : 0) : 650 + i * 40,
    y: 70 + ((t.id - 1) % 13) * 36,
  }));
  p.trails = [{ id: "def", x1: 410, y1: 270, x2: 490, y2: 270, type: "run" }];
  p.ball = { x: 630 + i * 35, y: 285 };
  p.roles = Object.fromEntries(
    positions.map((_, n) => [
      String(n + 1),
      n === 14
        ? "Couvrir l’espace derrière le premier rideau et annoncer les menaces."
        : "Monter avec le partenaire intérieur, garder les épaules face au jeu et annoncer sa cible.",
    ]),
  );
});
export const examplePrinciples: Principle[] = [
  {
    id: "identity",
    title: "Notre intention de jeu",
    text: "Exemple à adapter par le coach : avancer ensemble, garder le ballon vivant et jouer les espaces disponibles.",
  },
  {
    id: "attack",
    title: "Avec le ballon",
    text: "Garder de la profondeur. Fixer avant de passer. Prévoir un soutien intérieur et un soutien extérieur pour chaque porteur.",
  },
  {
    id: "defence",
    title: "Sans le ballon",
    text: "Communiquer de l’intérieur vers l’extérieur. Monter connectés. Se replacer immédiatement après chaque action.",
  },
  {
    id: "transition",
    title: "À la transition",
    text: "À la récupération, regarder l’espace avant de jouer. À la perte, protéger l’axe et reformer le premier rideau.",
  },
];
// Each launch has its own starting shape and phase-specific collective cues.
const launchRoles: Record<string, string[]> = {
  touche: [
    "Soutenir le sauteur avant, puis libérer la zone.",
    "Annoncer la cible et lancer à la hauteur convenue.",
    "Soutenir le sauteur avant en coordination avec le 1.",
    "Être disponible comme cible avant.",
    "Lire l’annonce et proposer la cible au milieu.",
    "Soutenir la cible au milieu, puis se replacer.",
    "Sécuriser la première zone de soutien à la sortie.",
    "Être disponible en fond d’alignement et protéger la sortie.",
    "Se présenter derrière la réception et servir le 10.",
    "Garder de la profondeur et annoncer le lancement.",
    "Conserver la largeur côté fermé.",
    "Fixer son défenseur par une course droite.",
    "Garder la connexion avec le 12 et attaquer l’intervalle.",
    "Rester large pour offrir une solution extérieure.",
    "Se présenter en deuxième ligne d’attaque.",
  ],
  large: [
    "Offrir un soutien proche au premier point de fixation.",
    "Se rendre disponible dans le groupe central.",
    "Assurer le soutien intérieur du porteur.",
    "Avancer dans l’axe pour fixer la défense.",
    "Préparer le groupe suivant en restant derrière le ballon.",
    "Conserver la largeur côté opposé.",
    "Suivre le porteur et annoncer le soutien.",
    "Se proposer comme porteur dans le groupe central.",
    "Accélérer la circulation une fois le ballon disponible.",
    "Lire la défense et orienter le transfert.",
    "Rester large et communiquer l’espace disponible.",
    "Fixer avant de transmettre au 13.",
    "Recevoir en mouvement et décider de jouer à l’aile.",
    "Attendre en largeur sans devancer le ballon.",
    "Suivre en profondeur comme deuxième distributeur.",
  ],
  retour: [
    "Revenir en soutien intérieur du réceptionneur.",
    "Se rendre disponible près du premier porteur.",
    "Offrir une solution de conservation si la relance est fermée.",
    "Se replacer derrière le ballon et communiquer.",
    "Protéger la continuité avec un soutien proche.",
    "Rejoindre le couloir de relance côté gauche.",
    "Rejoindre le couloir de relance côté droit.",
    "Offrir une course forte dans l’axe.",
    "Rejoindre le ballon et annoncer l’organisation.",
    "Observer le premier rideau et choisir le côté de relance.",
    "Annoncer la réception et proposer une solution sur l’aile.",
    "Se rendre disponible en profondeur.",
    "Connecter le distributeur à l’aile opposée.",
    "Conserver la largeur du côté ouvert.",
    "Annoncer la réception, observer l’espace et attendre les soutiens.",
  ],
  tempo: [
    "Se proposer comme soutien immédiat.",
    "Préparer la conservation au contact.",
    "Rester disponible pour la phase suivante.",
    "Porter dans l’axe sur l’annonce du distributeur.",
    "Offrir une solution courte derrière le porteur.",
    "Se placer en soutien intérieur sans dépasser le ballon.",
    "Se placer en soutien extérieur et communiquer.",
    "Suivre le groupe porteur pour assurer la continuité.",
    "Annoncer le tempo et servir un joueur lancé.",
    "Organiser la prochaine phase en conservant la profondeur.",
    "Maintenir la largeur pour étirer la défense.",
    "Offrir une option derrière le groupe d’avants.",
    "Observer le déplacement du rideau défensif.",
    "Garder le couloir extérieur disponible.",
    "Couvrir le fond et se proposer en deuxième ligne.",
  ],
};
for (const p of examplePlays) {
  if (!launchRoles[p.id]) continue;
  p.phases.forEach((phase, index) => {
    phase.roles = Object.fromEntries(
      launchRoles[p.id].map((r, i) => [
        String(i + 1),
        `${r}${index === 0 ? "" : index === 1 ? " Ajuster sa course au déplacement du ballon." : " Se rendre à nouveau disponible et annoncer son replacement."}`,
      ]),
    );
    let home: number[][];
    if (p.id === "touche") {
      home = [
        [425, 110],
        [450, 62],
        [465, 110],
        [445, 145],
        [445, 210],
        [425, 175],
        [465, 175],
        [445, 255],
        [390, 280],
        [330, 320],
        [260, 475],
        [300, 370],
        [275, 420],
        [220, 530],
        [190, 350],
      ];
      phase.ball = [
        { x: 450, y: 62 },
        { x: 445, y: 210 },
        { x: 385, y: 320 },
      ][index];
      phase.note = [
        "Le talonneur annonce la combinaison. Les sauteurs et soutiens coordonnent leur timing.",
        "Contrôler la réception avant de transmettre au 9. La ligne arrière conserve sa profondeur.",
        "Le 10 reçoit derrière la ligne de conquête, fixe et lance les centres.",
      ][index];
    } else if (p.id === "retour") {
      home = [
        [360, 190],
        [340, 250],
        [360, 310],
        [320, 365],
        [330, 435],
        [290, 120],
        [290, 495],
        [300, 300],
        [255, 255],
        [190, 220],
        [130, 110],
        [185, 300],
        [175, 375],
        [125, 490],
        [115, 310],
      ];
      phase.ball = { x: 135 + index * 105, y: 310 };
      phase.note = [
        "Le joueur du fond annonce sa réception. Les partenaires se replacent derrière lui.",
        "Le réceptionneur choisit le couloir disponible et connecte ses soutiens.",
        "Avancer si l’espace reste ouvert ; sinon conserver et reconstruire une attaque organisée.",
      ][index];
    } else {
      home = [
        [395, 330],
        [380, 380],
        [405, 430],
        [450, 280],
        [420, 210],
        [355, 110],
        [380, 495],
        [425, 355],
        [365, 285],
        [295, 265],
        [235, 80],
        [265, 185],
        [235, 145],
        [215, 525],
        [190, 335],
      ];
      phase.ball = { x: 440 + index * 85, y: 290 - index * 50 };
      phase.note =
        p.id === "large"
          ? [
              "Fixer la défense avec une menace dans l’axe. Les extérieurs conservent la largeur.",
              "Transférer le ballon derrière le premier groupe après la fixation.",
              "Accélérer vers l’espace libre, avec un soutien intérieur et extérieur.",
            ][index]
          : [
              "Former un groupe porteur avec deux soutiens proches.",
              "Avancer dans l’axe et conserver une solution de passe avant le contact.",
              "Recycler le ballon puis reformer un groupe de soutien disponible.",
            ][index];
    }
    phase.players = home
      .map<Player>(([x, y], i) => ({ id: i + 1, x: x + index * 70, y, team: "home" as const }))
      .concat(
        formation()
          .filter((v) => v.team === "away")
          .map((v) => ({ ...v, x: 610 + index * 35 + (v.id > 13 ? 160 : 0), y: 75 + ((v.id - 1) % 13) * 37 })),
      );
    phase.trails = [
      {
        id: `${p.id}-run-${index}`,
        x1: home[9][0] + index * 70,
        y1: home[9][1],
        x2: home[9][0] + 130 + index * 70,
        y2: home[9][1] - 20,
        type: "run",
      },
    ];
  });
}
