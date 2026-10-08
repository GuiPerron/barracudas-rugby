// Boutique : réservation sans paiement en ligne, paiement et cueillette à l'entraînement.
// Ne rien inventer : prix, tailles et textes viennent du club.

export type Article = {
  id: string;
  nom: string;
  sousTitre: string;
  campagne?: string;
  accroche?: string;
  prix: number;
  // Coupes et tailles : à remplacer par l'inventaire fourni par le club (stock = null → non suivi)
  coupes: { nom: string; tailles: { t: string; stock: number | null }[] }[];
  images: { src: string; alt: string; label: string }[];
  points: string[];
  partenaires?: string[];
};

export const ARTICLES: Article[] = [
  {
    id: "tshirt-supporteur",
    nom: "T-shirt supporteur officiel",
    sousTitre: "Barracudas Rugby ’98",
    campagne: "Campagne de financement 2026",
    accroche: "Portez fièrement les couleurs de votre équipe de rugby !",
    prix: 25,
    // Inventaire fourni par le club (8 oct. 2026). Mettre à jour après chaque réservation confirmée ; 0 = épuisé.
    coupes: [
      { nom: "Homme", tailles: [{ t: "XL", stock: 2 }, { t: "2XL", stock: 3 }, { t: "3XL", stock: 2 }] },
      { nom: "Femme", tailles: [{ t: "S", stock: 2 }, { t: "L", stock: 4 }, { t: "XL", stock: 1 }, { t: "2XL", stock: 1 }] },
      { nom: "Enfant", tailles: [{ t: "M", stock: 1 }, { t: "L", stock: 10 }, { t: "XL", stock: 2 }] },
    ],
    images: [
      { src: "tshirt-devant", alt: "T-shirt marine chiné, devant : Barracudas Rugby ’98", label: "Devant" },
      { src: "tshirt-dos", alt: "T-shirt marine chiné, dos : logo du club et partenaires officiels", label: "Dos" },
    ],
    points: [
      "Marine chiné, imprimé ciel au devant",
      "Au dos : logo du club et nos partenaires officiels",
    ],
    partenaires: [
      "Pascal Dupuis Avocat", "Conception Boréale", "Actiforme Kin + Physio", "Glen Morgan’s Irish Pub",
      "Blackbox St-Jean", "Actisport", "Unibroue", "TBC Fabrication",
    ],
  },
];

export const RESERVATION = {
  paiement: "Aucun paiement en ligne : vous payez à la cueillette.",
  cueillette: "Cueillette et paiement à l’entraînement.",
  confirmation: "Le club vous confirme la réservation par courriel.",
};
