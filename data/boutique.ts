// Articles de la boutique (précommande sans paiement, cueillette à l'entraînement).
// À remplir avec les articles et prix fournis par le club. Ne rien inventer.
export type Article = { id: string; nom: string; prix: number; tailles?: string[]; img?: string };
export const ARTICLES: Article[] = [];
