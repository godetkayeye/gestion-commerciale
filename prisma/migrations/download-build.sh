#!/bin/bash

# Script pour télécharger .next.tar.gz directement depuis GitHub
# Usage: ./download-build.sh

set -e

echo "📥 Téléchargement de .next.tar.gz depuis GitHub..."

# URL du fichier brut sur GitHub (remplacez par votre repo)
REPO="godetkayeye/gestion-commerciale"
BRANCH="main"
FILE=".next.tar.gz"

# Créer un lien de téléchargement direct
# Note: GitHub ne permet pas de télécharger directement les fichiers binaires via raw
# Il faut utiliser l'API GitHub ou un service externe

echo "⚠️  GitHub ne permet pas de télécharger directement les fichiers binaires."
echo ""
echo "📤 Utilisez plutôt transfer.sh :"
echo ""
echo "1. Sur votre machine locale, uploadez le fichier :"
echo "   curl --upload-file .next.tar.gz https://transfer.sh/.next.tar.gz"
echo ""
echo "2. Copiez l'URL retournée et sur le VPS, téléchargez :"
echo "   wget [URL] -O .next.tar.gz"
echo ""

# Alternative: utiliser git show pour récupérer le fichier (mais cela peut aussi échouer)
echo "🔄 Tentative alternative avec git show (peut échouer si manque de mémoire)..."
if git show origin/main:.next.tar.gz > .next.tar.gz 2>/dev/null; then
    echo "✅ Fichier téléchargé avec succès!"
    ./prisma/migrations/extract-build.sh
else
    echo "❌ Échec. Utilisez transfer.sh comme indiqué ci-dessus."
    exit 1
fi

