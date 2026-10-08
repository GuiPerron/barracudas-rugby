// Solution de repli tant que l'envoi des formulaires (Resend) n'est pas configuré :
// on ouvre le logiciel de courriel du visiteur avec la demande déjà rédigée.
const LIB: Record<string, string> = {
  sujet: "Sujet", nom: "Nom", courriel: "Courriel", telephone: "Téléphone", message: "Message",
  entreprise: "Entreprise", forfait: "Forfait", entente: "Durée", article: "Article", taille: "Taille", quantite: "Quantité", total: "Total",
};
export function ouvrirCourriel(objet: string, data: Record<string, unknown>, to = "info@barracudasrugby.com") {
  const corps = Object.entries(data)
    .filter(([k, v]) => LIB[k] && String(v ?? "").trim())
    .map(([k, v]) => `${LIB[k]} : ${v}`)
    .join("\n");
  location.href = `mailto:${to}?subject=${encodeURIComponent(objet)}&body=${encodeURIComponent(corps + "\n")}`;
}
