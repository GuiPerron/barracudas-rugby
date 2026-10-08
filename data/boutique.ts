// Boutique : réservation sans paiement en ligne, paiement et cueillette à l'entraînement.
// Ne rien inventer : prix, tailles et textes viennent du club.

export type Article = {
  id: string;
  nom: string;
  sousTitre: string;
  prix: number;
  tailles: string[];
  images: { src: string; alt: string; label: string }[];
  points: string[];
  partenaires?: string[];
};

export const ARTICLES: Article[] = [
  {
    id: "tshirt-supporteur",
    nom: "T-shirt supporteur officiel",
    sousTitre: "Barracudas Rugby ’98",
    prix: 25,
    // TODO : confirmer les tailles offertes avec le club
    tailles: ["S", "M", "L", "XL", "2XL"],
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
