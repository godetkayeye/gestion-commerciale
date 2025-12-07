#!/bin/bash

# Script pour réassembler .next.tar.gz à partir des parties
# Usage: ./assemble-build.sh

set -e

echo "🔧 Réassemblage de .next.tar.gz à partir des parties..."

# Vérifier que les parties existent
if [ ! -f ".next.tar.gz.partaa" ]; then
    echo "❌ Les parties .next.tar.gz.part* n'existent pas."
    echo "   Exécutez d'abord: git pull origin main"
    exit 1
fi

# Compter les parties
PARTS=$(ls -1 .next.tar.gz.part* 2>/dev/null | wc -l)

if [ "$PARTS" -eq 0 ]; then
    echo "❌ Aucune partie trouvée."
    exit 1
fi

echo "📦 Réassemblage de $PARTS parties..."

# Réassembler les parties
cat .next.tar.gz.part* > .next.tar.gz

# Vérifier que le fichier a été créé
if [ ! -f ".next.tar.gz" ]; then
    echo "❌ Erreur lors du réassemblage."
    exit 1
fi

# Vérifier la taille (devrait être ~37MB)
SIZE=$(du -h .next.tar.gz | cut -f1)
echo "✅ Archive réassemblée: .next.tar.gz ($SIZE)"

# Extraire le build
echo ""
echo "📦 Extraction du build..."
./prisma/migrations/extract-build.sh

