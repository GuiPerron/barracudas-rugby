# Barracudas Rugby · site web (phase 1)

Site du Club de rugby Les Barracudas de Saint-Jean-sur-Richelieu.
Next.js (export statique) hébergé sur **Cloudflare Pages**, formulaires via une **fonction Pages** (`functions/api/formulaire.ts`).

## Démarrer

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # génère out/
```

Nouvelles photos : déposer l'original (JPG) dans `photos-src/`, puis `npm run images` (WebP 960 et 1920 px dans `public/img/`). Les écussons `crest-XXX.png` deviennent `public/crests/XXX.webp`.

## Où modifier le contenu

| Contenu | Fichier |
|---|---|
| Menu, hero, actualités, chiffres du club | `data/site.ts` |
| Résultats et classement (PlayHQ) | `data/saison-2026.ts` |
| Plan de commandite (textes du CA) | `data/commandites.ts` |
| Articles de la boutique (précommande) | `data/boutique.ts` |
| Couleurs, typo, règles | `DESIGN.md` → `app/globals.css` |

Règle : aucun contenu inventé. Ce qui manque reste vide (la page affiche « en préparation »).

## Cloudflare Pages

1. Cloudflare > Workers & Pages > Créer > Pages > Connecter à Git > choisir ce dépôt.
2. Préréglage : *Next.js (Static HTML Export)*. Commande : `npm run build`. Dossier : `out`.
3. Variables (Settings > Variables and secrets) :
   - `RESEND_API_KEY` (secret) : envoi des formulaires. Domaine d'envoi `barracudasrugby.com` à vérifier dans Resend (enregistrements DNS).
   - `TURNSTILE_SECRET` (secret, optionnel) : anti-pourriel.
   - `NEXT_PUBLIC_INDEX=1` seulement au lancement officiel (sinon le site reste en `noindex`).
4. Domaine : après la bascule DNS, ajouter `barracudasrugby.com` et `www` dans Custom domains.

Les courriels du club restent sur Google Workspace ; ne pas toucher aux enregistrements MX.

## Reste à obtenir du club

- URL Facebook exacte et URL Instagram (`data/site.ts`, `LIENS`)
- Articles et prix de la boutique
- Logos des commanditaires
- Accès DNS (Squarespace Domains), comptes GitHub et Cloudflare du club (transfert du dépôt)
- Adresse `commandites@` (formulaire de commandite, `wrangler.toml`)
- Accord des photographes (Darquise Baribeau, Stéphane Harbec)
