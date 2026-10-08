#!/bin/bash
# Pousse le code du site Barracudas sur GitHub (dépôt temporaire GuiPerron/barracudas-rugby).
# Cloudflare Pages reconstruit et publie automatiquement à chaque poussée.
set -e
cd "$(dirname "$0")"
REPO="https://github.com/GuiPerron/barracudas-rugby.git"

if grep -rniE "re_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|api[_-]?key *= *['\"][A-Za-z0-9]" --include='*.ts' --include='*.tsx' --include='*.toml' --include='*.mjs' . --exclude-dir=node_modules >/dev/null; then
  echo "⛔ Une clé secrète semble écrite dans le code : publication annulée."; read -p "Entrée pour fermer…"; exit 1
fi

if [ ! -d .git ]; then
  git init -q -b main
  git remote add origin "$REPO"
fi

git add -A
if git diff --cached --quiet; then
  echo "Aucun changement à publier."
else
  MSG="${1:-Mise à jour du site}"
  git commit -q -m "$MSG

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01QiViWP1P2yYScnPnzJqtqh"
fi

if git push -q -u origin main; then
  echo "✅ Poussé sur $REPO"
  echo "Cloudflare Pages publiera la nouvelle version dans 1 à 2 minutes."
else
  echo ""
  echo "⚠️  La poussée a échoué. Si c'est la première fois :"
  echo "   1. Crée le dépôt PRIVÉ vide : https://github.com/new  (nom : barracudas-rugby, sans README)"
  echo "   2. Relance ce script."
fi
read -p "Entrée pour fermer…"
