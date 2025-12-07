#!/bin/bash

# Script pour diviser .next.tar.gz en plusieurs parties
# Usage: ./split-build.sh

set -e

if [ ! -f ".next.tar.gz" ]; then
    echo "❌ Le fichier .next.tar.gz n'existe pas."
    exit 1
fi

echo "📦 Division de .next.tar.gz en parties de 10MB..."

# Diviser en parties de 10MB
split -b 10M .next.tar.gz .next.tar.gz.part

# Compter les parties
PARTS=$(ls -1 .next.tar.gz.part* | wc -l)

echo "✅ Archive divisée en $PARTS parties"
echo ""
echo "📤 Maintenant, ajoutez et commitez les parties :"
echo "   git add .next.tar.gz.part*"
echo "   git commit -m 'Ajout build divisé en parties'"
echo "   git push origin main"
echo ""
echo "📥 Sur le VPS, pour réassembler :"
echo "   git pull origin main"
echo "   cat .next.tar.gz.part* > .next.tar.gz"
echo "   ./prisma/migrations/extract-build.sh"

