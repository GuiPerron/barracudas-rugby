// Boutique : réservation sans paiement en ligne, paiement et cueillette à l'entraînement.
// Ne rien inventer : prix, tailles et textes viennent du club.

export type Article = {
  id: string;
  nom: string;
  edition?: string; // nouveau t-shirt chaque année
  sousTitre: string;
  campagne?: string;
  accroche?: string;
  prix: number;
  // Inventaire en direct : Google Sheet publié (CSV « cle,stock », ex. T_2026_homme_XL,2). Le stock ci-dessous sert de repli.
  stockCsv?: string;
  stockPrefixe?: string;
  // Coupes et tailles : à remplacer par l'inventaire fourni par le club (stock = null → non suivi)
  coupes: { nom: string; tailles: { t: string; stock: number | null }[] }[];
  images: { src: string; alt: string; label: string }[];
  points: string[];
  partenaires?: { nom: string; url?: string }[];
};

export const ARTICLES: Article[] = [
  {
    id: "tshirt-supporteur",
    nom: "T-shirt supporteur officiel",
    edition: "Édition 2026",
    sousTitre: "Barracudas Rugby ’98",
    campagne: "Campagne de financement 2026",
    accroche: "Portez fièrement les couleurs de votre équipe de rugby !",
    prix: 25,
    stockCsv: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQyW52TNHkjxOzpxP601Wvtnqk9EPXt85Hg5f09Hpu_r-lR_2OkVcM0Qek5FfSE_rBpoLLx9Ofg6mk1/pub?gid=0&single=true&output=csv",
    stockPrefixe: "T_2026",
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
    // Sites vérifiés et confirmés le 8 oct. 2026. Sans url : site inconnu.
    partenaires: [
      { nom: "Pascal Dupuis Avocat" },
      { nom: "Conception Boréale", url: "https://conceptionboreale.com" },
      { nom: "Actiforme Kin + Physio", url: "https://actiforme.com" },
      { nom: "Glen Morgan’s Irish Pub", url: "https://pubglenmorgan.com" },
      { nom: "Blackbox St-Jean", url: "https://blackboxstjean.com" },
      { nom: "Actisport", url: "https://actisport.ca" },
      { nom: "Unibroue", url: "https://www.unibroue.com" },
      { nom: "TBC Fabrication", url: "https://www.tbcfabrication.com" },
    ],
  },
];

export const RESERVATION = {
  paiement: "Aucun paiement en ligne : vous payez à la cueillette.",
  cueillette: "Cueillette et paiement à l’entraînement.",
  confirmation: "Le club vous confirme la réservation par courriel.",
};
