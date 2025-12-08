#!/bin/bash

# Script pour générer Prisma Client sur le VPS avec optimisations mémoire
# Usage: ./prisma/migrations/generate-prisma-vps.sh

set -e

echo "🔧 Génération de Prisma Client sur le VPS..."
echo ""

# Vérifier la mémoire disponible
echo "📊 Vérification de la mémoire disponible..."
free -h
echo ""

# Nettoyer les anciens fichiers Prisma pour libérer de l'espace
if [ -d "app/generated/prisma" ]; then
    echo "🧹 Nettoyage de l'ancien Prisma Client..."
    rm -rf app/generated/prisma
    echo "✅ Ancien Prisma Client supprimé"
    echo ""
fi

# Nettoyer le cache npm/node_modules si nécessaire
echo "🧹 Nettoyage du cache npm..."
npm cache clean --force 2>/dev/null || true
echo ""

# Générer Prisma avec des options mémoire optimisées
echo "📦 Génération de Prisma Client avec optimisations mémoire..."
echo "   (Cela peut prendre quelques minutes sur un VPS avec peu de RAM)"
echo ""

# Utiliser NODE_OPTIONS pour limiter la mémoire et activer le garbage collector agressif
export NODE_OPTIONS="--max-old-space-size=2048 --gc-interval=100"
export NODE_ENV=production

# Essayer de générer Prisma
if NODE_OPTIONS="--max-old-space-size=2048 --gc-interval=100" npx prisma generate; then
    echo "✅ Prisma Client généré avec succès"
    echo ""
    
    # Vérifier que le client a été généré
    if [ -d "app/generated/prisma" ] && [ -f "app/generated/prisma/client.ts" ]; then
        echo "✅ Vérification: Prisma Client trouvé dans app/generated/prisma"
        echo ""
        echo "📊 Taille du Prisma Client généré:"
        du -sh app/generated/prisma
        echo ""
        echo "🎉 Génération terminée avec succès!"
    else
        echo "❌ Prisma Client généré mais fichiers non trouvés"
        exit 1
    fi
else
    echo "❌ Échec de la génération de Prisma Client"
    echo ""
    echo "💡 Solutions alternatives:"
    echo "   1. Générer Prisma localement et l'inclure dans le build"
    echo "   2. Augmenter le swap sur le VPS:"
    echo "      sudo fallocate -l 2G /swapfile"
    echo "      sudo chmod 600 /swapfile"
    echo "      sudo mkswap /swapfile"
    echo "      sudo swapon /swapfile"
    echo "   3. Utiliser le build pré-compilé avec Prisma inclus"
    exit 1
fi

