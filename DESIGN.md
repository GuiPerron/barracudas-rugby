---
version: alpha
name: Barracudas Rugby
description: Système de design du site du Club de rugby Les Barracudas de Saint-Jean-sur-Richelieu (V1, octobre 2026).
colors:
  primary: "#132644"
  primary-light: "#24427A"
  secondary: "#68CEF6"
  secondary-dark: "#1F6F94"
  tertiary: "#FF5A3C"
  neutral: "#F4F7FA"
  surface: "#FFFFFF"
  on-surface: "#161616"
  on-primary: "#FFFFFF"
  muted: "#4A5568"
  border: "#D5DEE7"
  error: "#B42318"
typography:
  headline-display:
    fontFamily: Barlow Condensed
    fontSize: 72px
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: 0.01em
  headline-lg:
    fontFamily: Barlow Condensed
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.05
  headline-md:
    fontFamily: Barlow Condensed
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.1
  headline-sm:
    fontFamily: Barlow Condensed
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.2
  stat:
    fontFamily: Barlow Condensed
    fontSize: 96px
    fontWeight: 700
    lineHeight: 1
  body-lg:
    fontFamily: Barlow
    fontSize: 19px
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: Barlow
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: Barlow
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  label-md:
    fontFamily: Barlow
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0.08em
  label-sm:
    fontFamily: Barlow
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0.2em
rounded:
  none: 0px
  sm: 4px
  md: 8px
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 32px
  xl: 64px
  xxl: 120px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 72px
  max-width: 1280px
  grid-columns: 12
components:
  button-primary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: 14px 24px
  button-primary-hover:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
  button-secondary:
    backgroundColor: transparent
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: 12px 22px
  button-accent:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: 14px 24px
  nav:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    height: 72px
  hero:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.headline-display}"
    height: 88vh
  match-bar:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-md}"
    padding: 16px 32px
  match-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 24px
  news-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 0px
  stat-block:
    textColor: "{colors.secondary}"
    typography: "{typography.stat}"
  section-dark:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    padding: 120px 72px
  section-light:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    padding: 120px 72px
  footer:
    backgroundColor: "{colors.on-surface}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-sm}"
    padding: 64px 72px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.sm}"
    padding: 12px 14px
  input-error:
    textColor: "{colors.error}"
---

# Barracudas Rugby — DESIGN.md

## Overview

Site officiel du Club de rugby Les Barracudas de Saint-Jean-sur-Richelieu : équipe senior masculine de rugby à XV, ligue provinciale de la Fédération de Rugby du Québec. Site en **français seulement**.

**Publics :** recrues, joueurs, familles et partisans, commanditaires (PME locales).
**Valeurs (texte du CA) :** respect, discipline, persévérance, esprit d'équipe.
**Ressenti visé :** un club amateur qui se présente comme un club pro. Sobre, sombre, puissant, rapide à lire. Jamais « gadget » ni générique.

**Signature graphique : la Vague.** Des bandes ondulées parallèles d'épaisseur égale, déformées par une onde d'impact. Elle évoque à la fois l'eau (barracuda) et le contact (plaquage, mêlée). Fichier source : `vague-signature.svg`.

**Imagerie :** vraies photos de match du club. Deux traitements seulement :
1. Photo naturelle, plein cadre, sans filtre ni dégradé (actualités, galeries).
2. Photo en aplats 3 tons (marine / marine clair / ciel), rendu sérigraphie avec trame, produite dans Magnific (Seedream 5 Pro, photo du club en référence) — annonces, recrutement, réseaux sociaux.

Références qui ont guidé les règles : stade.fr (accent unique, bandeau prochain match), montpellier-rugby.com (cartes de match, alternance de sections), section-paloise.com (chiffres clés géants), projets de Leroy Tremblot (lignes uniformes, aplats).

## Colors

Base sombre, un accent froid dominant, un accent chaud rare.

- **Primary — Marine (#132644) :** fond principal du site (nav, hero, sections sombres), titres sur fond clair.
- **Primary-light — Marine clair (#24427A) :** bandes de la Vague, deuxième ton des photos en aplats. Jamais pour du texte.
- **Secondary — Ciel (#68CEF6) :** l'accent principal. Boutons principaux, chiffres clés, états de survol, bandes de la Vague. **Uniquement sur fond foncé** (8,5:1 sur marine). Sur blanc : 1,8:1, interdit pour le texte.
- **Secondary-dark — Ciel foncé (#1F6F94) :** liens et surtitres sur fond clair (5,6:1 sur blanc).
- **Tertiary — Corail (#FF5A3C) :** accent rare, environ 5 % de la surface : une bande dans la Vague, le badge « EN DIRECT », un seul bouton par page au maximum (ex. « Devenir partenaire »). Texte corail sur marine : 4,9:1 (OK). Jamais de texte blanc sur corail sous 24 px. Jamais corail collé au ciel.
- **Neutral (#F4F7FA) / Surface (#FFFFFF) :** sections claires et cartes.
- **On-surface — Noir (#161616) :** texte courant sur fond clair (18:1), pied de page.

## Typography

Duo **Barlow Condensed italique 800** (titres) + **Barlow** (texte), Google Fonts. Code des clubs du Top 14 (Stade Français, UBB) : capitales italiques grasses = vitesse.

- **Titres :** Barlow Condensed italique 800, toujours en MAJUSCULES, interligne serré. Le titre du hero peut monter à 72 px desktop / 44 px mobile.
- **Chiffres clés :** Barlow Condensed italique 800 à 96 px en ciel sur marine, légende de 2–3 mots en dessous (règle Section Paloise).
- **Texte :** Barlow 400 à 17 px, interligne 1,6. Gras 700 pour les mises en avant.
- **Libellés et boutons :** Barlow 700, majuscules, interlettrage 0,08–0,2 em.
- Maximum deux familles et trois graisses par écran.

## Layout

- Grille de 12 colonnes, largeur max 1280 px, gouttière 24 px, marges 72 px desktop / 16 px mobile. Échelle d'espacement de 8 px.
- Mobile d'abord : tout doit fonctionner à 375 px de large sans défilement horizontal.
- **Rythme de page :** alternance de sections sombres (marine) et claires (gris clair / blanc), 120 px d'espacement vertical sur desktop, 64 px sur mobile.
- **Page d'accueil (maquette E retenue) :** barre utilitaire → menu par-dessus la photo, logo centré → hero plein cadre avec 3 sujets (/01 /02 /03) → bandeau prochain match (compte à rebours + 3 matchs avec écussons) → stories → actualités (une principale, 2 cartes, fil de brèves) → calendrier + classement sur photo (PlayHQ) → Barracudas TV → boutique → « Depuis 1998 » (valeurs, chiffres, tuiles) → partenaires par niveau → pied de page avec infolettre.

## Elevation & Depth

Design **plat**. Aucune ombre portée, aucun dégradé, aucun effet de verre. Les photos de fond de section reçoivent un voile marine uni (rgba(19,38,68,.4 à .86)) pour la lisibilité. La hiérarchie vient du contraste de couleur (sections marine vs claires), de la taille des titres et des aplats. Seule exception : une ombre de texte légère (0 2px 14px rgba(0,0,0,.6)) quand du texte est posé sur une photo naturelle.

## Shapes

Formes nettes et sportives : rayon de 4 px pour boutons et champs, 8 px pour les cartes et les photos. Boutons en pilule (rayon complet), cartes 10–12 px.

**Marque de section (provisoire) :** trois traits obliques ciel devant chaque titre de section.

**La Vague (en réserve, à retravailler — ne pas utiliser pour l'instant) :**
- Bandes d'épaisseur strictement égale, bords nets, alternance marine / ciel (ou marine / marine clair en version discrète).
- Une seule bande corail par composition, au maximum.
- Centre de l'impact hors cadre ou en bord : on voit des courbes amples, en gros plan.
- Usages : fond du hero sans photo, bandeaux d'appel (« Devenir partenaire », « Rejoignez les Barracudas »), séparateurs de section, réseaux sociaux, imprimés.
- Animation possible : lente propagation de l'onde (8–12 s, en boucle). Désactivée si `prefers-reduced-motion`.

## Components

- **Nav :** marine, logo à gauche (ciel sur marine), liens en libellés majuscules blancs, bouton « Boutique » à droite. Menu plein écran sur mobile.
- **Hero :** photo naturelle plein cadre, sans dégradé ; surtitre en libellé ciel, titre Oswald blanc en bas à gauche, un bouton principal (ciel) + un bouton secondaire (contour blanc).
- **Bandeau prochain match :** marine, directement sous le hero : « PROCHAIN MATCH » en Oswald ciel, date · Barracudas vs adversaire · terrain. Données issues de PlayHQ.
- **Carte de match :** gabarit unique pour calendrier et résultats : date en gros chiffres, adversaire, heure, terrain, lien « Fiche du match ». Résultat : score en Oswald.
- **Carte d'actualité :** photo 16:9 en haut (rayon 8 px), catégorie en libellé ciel foncé, titre Oswald 22 px, date.
- **Bloc chiffres clés :** chiffres Oswald 96 px ciel sur marine, légende courte blanche.
- **Partenaires :** logos regroupés par niveau (Or, Argent, Bronze), en monochrome blanc sur marine ou couleur sur blanc, jamais déformés.
- **Boutons :** principal ciel / texte marine ; secondaire contour blanc sur fond foncé ; accent corail (un par page max). Survol : principal passe au blanc. Focus visible : contour 3 px ciel.
- **Champs de formulaire :** fond blanc, bordure #D5DEE7, rayon 4 px, libellé au-dessus, message d'erreur en rouge sous le champ.
- **Pied de page :** noir #161616, logo, liens, réseaux, crédit photo.

## Do's and Don'ts

- Do : vraies photos du club, avec crédit du photographe (David Fournier, Alain Robitaille, Stéphane Harbec) et accord de leur part.
- Do : un seul accent ciel dominant ; le corail reste rare.
- Do : contraste WCAG AA (4,5:1 texte normal, 3:1 grands titres).
- Do : bandes de la Vague toujours d'épaisseur égale.
- Don't : texte ciel sur fond blanc (1,8:1).
- Don't : dégradé dans le hero, « blob », ombres portées, effets 3D.
- Don't : chevrons en escalier ou bleu-blanc-rouge (identité de France Rugby).
- Don't : adversaire reconnaissable en gros plan sur les visuels promotionnels.
- Don't : texte généré par l'IA laissé dans une image (vérifier chaque visuel Magnific).
- Don't : inventer des chiffres ou des slogans pour le club ; tout chiffre affiché vient du CA.
