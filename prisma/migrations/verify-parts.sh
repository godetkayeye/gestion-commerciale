#!/bin/bash

# Script pour vérifier l'intégrité des fichiers part* avant assemblage
# Usage: ./prisma/migrations/verify-parts.sh

set -e

echo "🔍 Vérification des fichiers .next.tar.gz.part*..."
echo ""

# Lister tous les fichiers part*
PARTS=$(ls -1 .next.tar.gz.part* 2>/dev/null | sort)
if [ -z "$PARTS" ]; then
    echo "❌ Aucun fichier .next.tar.gz.part* trouvé"
    exit 1
fi

echo "📋 Fichiers trouvés:"
echo "$PARTS" | while read -r part; do
    SIZE=$(du -h "$part" | cut -f1)
    echo "   - $part ($SIZE)"
done
echo ""

# Calculer la taille totale attendue
TOTAL_SIZE=0
for part in $PARTS; do
    SIZE=$(stat -f%z "$part" 2>/dev/null || stat -c%s "$part" 2>/dev/null)
    TOTAL_SIZE=$((TOTAL_SIZE + SIZE))
done

TOTAL_SIZE_MB=$((TOTAL_SIZE / 1024 / 1024))
echo "📊 Taille totale des parties: ${TOTAL_SIZE_MB} MB"
echo ""

# Vérifier que tous les fichiers sont non-vides
echo "🔍 Vérification que tous les fichiers sont non-vides..."
ALL_OK=true
for part in $PARTS; do
    if [ ! -s "$part" ]; then
        echo "❌ $part est vide ou corrompu"
        ALL_OK=false
    fi
done

if [ "$ALL_OK" = true ]; then
    echo "✅ Tous les fichiers sont valides"
else
    echo "❌ Certains fichiers sont corrompus"
    exit 1
fi
echo ""

# Tester l'assemblage sans créer le fichier final
echo "🧪 Test d'assemblage (sans créer le fichier final)..."
if echo "$PARTS" | xargs cat > /tmp/test-assembly.tar.gz 2>/dev/null; then
    TEST_SIZE=$(du -h /tmp/test-assembly.tar.gz | cut -f1)
    echo "✅ Assemblage test réussi: ${TEST_SIZE}"
    
    # Tester l'intégrité gzip
    if gzip -t /tmp/test-assembly.tar.gz 2>/dev/null; then
        echo "✅ Archive test valide (gzip OK)"
    else
        echo "❌ Archive test corrompue (gzip échoué)"
        rm -f /tmp/test-assembly.tar.gz
        exit 1
    fi
    
    rm -f /tmp/test-assembly.tar.gz
    echo ""
    echo "✅ Tous les tests passés ! Les fichiers sont prêts pour l'assemblage."
else
    echo "❌ Échec de l'assemblage test"
    rm -f /tmp/test-assembly.tar.gz
    exit 1
fi

