// Contenu éditorial validé par le CA (octobre 2026). Ne rien inventer.

export const NAV = [
  { href: "/le-club/", label: "Le club" },
  { href: "/calendrier/", label: "Calendrier" },
  { href: "/commanditaires/", label: "Commanditaires" },
  { href: "/boutique/", label: "Boutique" },
  { href: "/contact/", label: "Contact" },
];

export const LIENS = {
  facebook: "https://www.facebook.com/barracudasrugby/",
  instagram: "https://www.instagram.com/barracudasrugbystjean/",
  espaceJoueurs: "https://www.playhq.com/", // TODO : phase 2 (portail joueurs) ; PlayHQ en attendant
  playhq: "https://www.playhq.com/",
};

export const COURRIEL = "info@barracudasrugby.com";
export const NOM_COMPLET = "Club de rugby Les Barracudas de Saint-Jean-sur-Richelieu";
export const CREDITS_PHOTO = "Photos : Darquise Baribeau, Stéphane Harbec";

export const HERO = [
  {
    img: "DB2", pos: "30% 30%",
    surtitre: "Recrutement · Saison 2027",
    titre: ["On recrute", "pour 2027 !"],
    texte: "Entraînements dès février, deux pratiques par semaine.",
    cta: { label: "Rejoindre l’équipe", href: "/contact/?sujet=rejoindre" },
    onglet: "On recrute pour 2027",
  },
  {
    img: "DB22", pos: "center 30%",
    surtitre: "Saison 2026 · Poule P3 A",
    titre: ["Demi-", "finalistes"],
    texte: "3e de la poule, 6 victoires, +247 au différentiel.",
    cta: { label: "Voir les résultats", href: "/calendrier/" },
    onglet: "Saison 2026 : demi-finale en P3 A",
  },
  {
    img: "SH53", pos: "center 40%",
    surtitre: "Commandites 2027",
    titre: ["Devenez", "partenaire"],
    texte: "Forfaits Or, Argent et Bronze. Logo sur le maillot avec une entente de 3 ans.",
    cta: { label: "Découvrir les forfaits", href: "/commanditaires/" },
    onglet: "Devenez partenaire 2027",
  },
];

export const STORIES = [
  { img: "DB23", label: "Recrutement", href: "/contact/?sujet=rejoindre" },
  { img: "DB6", label: "Saison 2026", href: "/calendrier/" },
  { img: "SH53", label: "L’équipe", href: "/le-club/" },
  { img: "DB25", label: "Commandites", href: "/commanditaires/" },
  { img: "SH9", label: "En images", href: "/le-club/#photos" },
];

export const ACTUALITES = [
  { img: "DB22", tag: "Saison 2026", date: "8 août 2026", titre: "Les Barracudas terminent demi-finalistes en P3 A", une: true },
  { img: "SH11", tag: "Résultat", date: "25 juillet 2026", titre: "64-0 face aux Barbs à Sunnybrook Park" },
  { img: "DB27", tag: "Commandites", date: "Octobre 2026", titre: "Plan de commandite 2027 : forfaits Or, Argent et Bronze", href: "/commanditaires/" },
];

export const CLUB = {
  devise: "« Respect, discipline, persévérance, esprit d’équipe. »",
  chiffres: [
    { n: 1998, label: "Fondation du club" },
    { n: 2007, label: "Champions de division" },
    { n: 7, label: "Finales de division" },
    { n: 35, label: "Joueurs en 2026" },
  ],
  tuiles: [
    { img: "SH53", label: "Notre histoire", href: "/le-club/#histoire" },
    { img: "DB27", label: "L’équipe 2026", href: "/le-club/#equipe" },
    { img: "DB23", label: "Rejoindre le club", href: "/contact/?sujet=rejoindre" },
    { img: "DB9", label: "Devenir bénévole", href: "/contact/?sujet=benevole" },
  ],
};

// Conseil d'administration 2026-2027 (fourni par Guillaume, 8 oct. 2026)
export const CA = [
  { poste: "Président", role: "Direction générale et communications", nom: "Jean Forget", courriel: "info@barracudasrugby.com" },
  { poste: "Vice-président", role: "Responsable gouvernance et commanditaires", nom: "Clément Poncin", courriel: "commandites@barracudasrugby.com" },
  { poste: "Administrateur", role: "Direction technique et gestion logistique", nom: "Christophe Morin", courriel: "technique@barracudasrugby.com" },
  { poste: "Administrateur", role: "Trésorier", nom: "Marc-André Lamoureux", courriel: "tresorier@barracudasrugby.com" },
  { poste: "Administrateur", role: "Secrétaire", nom: "Gabriel Bédard", courriel: "secretariat@barracudasrugby.com" },
];
