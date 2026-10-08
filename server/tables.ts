import { crud } from "./crud";
export const TACHES = crud("taches", ["titre", "details", "responsable", "echeance", "statut", "ordre"], ["titre"], "statut, ordre, id DESC");
export const COMMANDITES = crud("commandites", ["entreprise", "contact", "courriel", "telephone", "site", "forfait", "entente", "montant", "statut", "responsable", "prochaine_action", "prochaine_date", "notes"], ["entreprise"], "maj_le DESC");
export const SOUMISSIONS = crud("soumissions", ["statut", "note"], [], "recu_le DESC");
