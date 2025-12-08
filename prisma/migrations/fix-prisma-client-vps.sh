#!/bin/bash

# Script pour corriger Prisma Client sur le VPS
# Ce script génère Prisma Client et s'assure qu'il est accessible

set -e

echo "🔧 Correction de Prisma Client sur le VPS..."
echo ""

# 1. Vérifier la mémoire disponible
echo "📊 Vérification de la mémoire..."
free -h
echo ""

# 2. Nettoyer les anciens fichiers Prisma
echo "🧹 Nettoyage des anciens fichiers Prisma..."
if [ -d "app/generated/prisma" ]; then
    echo "   Conservation de app/generated/prisma (backup)"
    if [ -d "app/generated/prisma.backup" ]; then
        rm -rf app/generated/prisma.backup
    fi
    cp -r app/generated/prisma app/generated/prisma.backup 2>/dev/null || true
fi

# Nettoyer node_modules/.prisma si existe
if [ -d "node_modules/.prisma" ]; then
    rm -rf node_modules/.prisma
    echo "   node_modules/.prisma nettoyé"
fi

echo ""

# 3. Générer Prisma Client avec optimisations mémoire
echo "📦 Génération de Prisma Client..."
echo "   (Cela peut prendre quelques minutes)"
echo ""

export NODE_OPTIONS="--max-old-space-size=2048 --gc-interval=100"
export NODE_ENV=production

if NODE_OPTIONS="--max-old-space-size=2048 --gc-interval=100" npx prisma generate; then
    echo ""
    echo "✅ Prisma Client généré"
else
    echo ""
    echo "❌ Échec de la génération"
    echo "   Tentative avec plus de mémoire..."
    
    # Essayer avec encore plus de mémoire
    if NODE_OPTIONS="--max-old-space-size=3072" npx prisma generate; then
        echo "✅ Prisma Client généré (avec plus de mémoire)"
    else
        echo "❌ Échec même avec plus de mémoire"
        echo "💡 Solutions alternatives:"
        echo "   1. Augmenter le swap: sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile"
        echo "   2. Générer Prisma localement et copier les fichiers"
        exit 1
    fi
fi

echo ""

# 4. Vérifier que Prisma Client est généré
echo "🔍 Vérification de Prisma Client..."
if [ -d "app/generated/prisma" ] && [ -f "app/generated/prisma/client.ts" ]; then
    echo "✅ Prisma Client trouvé dans app/generated/prisma"
    FILE_COUNT=$(find app/generated/prisma -type f | wc -l)
    echo "   Fichiers: $FILE_COUNT"
else
    echo "❌ Prisma Client non trouvé dans app/generated/prisma"
    exit 1
fi

# Vérifier node_modules/.prisma (peut ne pas exister si output est personnalisé)
if [ -d "node_modules/.prisma" ]; then
    echo "✅ Prisma Client trouvé dans node_modules/.prisma"
else
    echo "ℹ️  Prisma Client non dans node_modules/.prisma (normal si output est personnalisé)"
fi

echo ""

# 5. Copier dans le build si nécessaire
echo "📦 Copie de Prisma Client dans le build..."
if [ -d ".next/server/app/generated" ]; then
    mkdir -p .next/server/app/generated
    if [ -d ".next/server/app/generated/prisma" ]; then
        rm -rf .next/server/app/generated/prisma
    fi
    cp -r app/generated/prisma .next/server/app/generated/
    echo "✅ Prisma Client copié dans le build"
else
    echo "⚠️  Dossier .next/server/app/generated n'existe pas"
    echo "   (Le build sera créé lors du prochain npm run build)"
fi

echo ""

# 6. Tester Prisma Client
echo "🧪 Test de Prisma Client..."
if [ -f "prisma/migrations/test-prisma-simple.js" ]; then
    if node prisma/migrations/test-prisma-simple.js 2>&1 | grep -q "Test réussi"; then
        echo "✅ Prisma Client fonctionne correctement"
    else
        echo "⚠️  Test Prisma échoué (vérifiez DATABASE_URL)"
        node prisma/migrations/test-prisma-simple.js 2>&1 | tail -5
    fi
else
    echo "⚠️  Script de test non trouvé"
fi

echo ""

# 7. Redémarrer PM2
echo "🚀 Redémarrage de PM2..."
if command -v pm2 &> /dev/null; then
    pm2 restart all
    echo "✅ PM2 redémarré"
    echo ""
    echo "📊 Statut PM2:"
    pm2 status
else
    echo "⚠️  PM2 non installé"
fi

echo ""
echo "🎉 Correction terminée!"
echo ""
echo "💡 Si l'authentification ne fonctionne toujours pas:"
echo "   1. Vérifiez les logs: pm2 logs gestion-commerciale --lines 50"
echo "   2. Testez l'authentification: node prisma/migrations/test-auth.js <email> <password>"

