#!/bin/bash

# Script pour résoudre le problème de lock Next.js
# Usage: ./fix-build-lock.sh

set -e

echo "🔧 Résolution du problème de lock Next.js..."
echo ""

# 1. Vérifier les processus Next.js
echo "1️⃣  Vérification des processus Next.js..."
NEXT_PROCESSES=$(ps aux | grep -i "next\|node.*build" | grep -v grep || true)
if [ -n "$NEXT_PROCESSES" ]; then
    echo "⚠️  Processus Next.js trouvés:"
    echo "$NEXT_PROCESSES"
    echo ""
    read -p "Voulez-vous les tuer? (o/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[OoYy]$ ]]; then
        pkill -f "next" || true
        pkill -f "node.*build" || true
        sleep 2
        echo "✅ Processus terminés"
    fi
else
    echo "✅ Aucun processus Next.js trouvé"
fi
echo ""

# 2. Supprimer le lock
echo "2️⃣  Suppression du lock..."
if [ -f ".next/lock" ]; then
    rm -f .next/lock
    echo "✅ Lock supprimé"
else
    echo "ℹ️  Aucun lock trouvé"
fi
echo ""

# 3. Nettoyer le dossier .next si nécessaire
echo "3️⃣  Vérification du dossier .next..."
if [ -d ".next" ]; then
    NEXT_SIZE=$(du -sh .next | cut -f1)
    echo "   Taille: $NEXT_SIZE"
    
    # Vérifier s'il y a des fichiers corrompus
    if [ -f ".next/BUILD_ID" ]; then
        echo "✅ Build ID trouvé"
    else
        echo "⚠️  Build ID manquant - le build peut être incomplet"
    fi
fi
echo ""

# 4. Option pour nettoyer complètement
read -p "Voulez-vous nettoyer complètement le dossier .next? (o/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[OoYy]$ ]]; then
    if [ -d ".next" ]; then
        rm -rf .next
        echo "✅ Dossier .next supprimé"
    fi
fi
echo ""

echo "🎉 Problème résolu!"
echo ""
echo "💡 Vous pouvez maintenant essayer:"
echo "   npm run build"
echo ""
echo "   OU si vous avez des problèmes de mémoire:"
echo "   Builder localement avec: ./build-and-deploy.sh"

