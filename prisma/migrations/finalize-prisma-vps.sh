#!/bin/bash

# Script pour finaliser la configuration de Prisma Client sur le VPS
# Usage: ./prisma/migrations/finalize-prisma-vps.sh

set -e

echo "🔧 Finalisation de la configuration Prisma Client sur le VPS..."
echo ""

# 1. Vérifier que Prisma Client est présent
echo "1️⃣  Vérification de Prisma Client..."
if [ ! -d "app/generated/prisma" ] || [ ! -f "app/generated/prisma/client.ts" ]; then
    echo "❌ Prisma Client non trouvé dans app/generated/prisma"
    echo "   Solution: Copier Prisma Client depuis la machine locale"
    exit 1
fi

FILE_COUNT=$(find app/generated/prisma -type f | wc -l)
echo "✅ Prisma Client trouvé: $FILE_COUNT fichiers"
echo ""

# 2. Copier dans le build
echo "2️⃣  Copie de Prisma Client dans le build..."
if [ -d ".next/server/app/generated" ]; then
    mkdir -p .next/server/app/generated
    if [ -d ".next/server/app/generated/prisma" ]; then
        rm -rf .next/server/app/generated/prisma
        echo "   Ancien Prisma Client supprimé du build"
    fi
    cp -r app/generated/prisma .next/server/app/generated/
    BUILD_COUNT=$(find .next/server/app/generated/prisma -type f | wc -l)
    echo "✅ Prisma Client copié dans le build: $BUILD_COUNT fichiers"
else
    echo "⚠️  Dossier .next/server/app/generated n'existe pas"
    echo "   (Le build sera créé lors du prochain déploiement)"
fi
echo ""

# 3. Créer un lien symbolique pour @prisma/client si nécessaire
echo "3️⃣  Configuration de node_modules/.prisma..."
if [ ! -d "node_modules/.prisma" ]; then
    mkdir -p node_modules/.prisma
    echo "✅ Dossier node_modules/.prisma créé"
fi

# Créer un lien symbolique vers le client généré
if [ ! -L "node_modules/.prisma/client" ] && [ ! -d "node_modules/.prisma/client" ]; then
    # Créer un lien symbolique
    ln -sf "$(pwd)/app/generated/prisma" node_modules/.prisma/client
    echo "✅ Lien symbolique créé: node_modules/.prisma/client -> app/generated/prisma"
elif [ -L "node_modules/.prisma/client" ]; then
    echo "✅ Lien symbolique existe déjà"
else
    echo "⚠️  node_modules/.prisma/client existe déjà (pas un lien)"
fi
echo ""

# 4. Tester Prisma Client
echo "4️⃣  Test de Prisma Client..."
if [ -f "prisma/migrations/test-prisma-simple.js" ]; then
    if node prisma/migrations/test-prisma-simple.js 2>&1 | grep -q "Test réussi"; then
        echo "✅ Prisma Client fonctionne correctement"
    else
        echo "⚠️  Test Prisma échoué, voir les détails:"
        node prisma/migrations/test-prisma-simple.js 2>&1 | tail -10
    fi
else
    echo "⚠️  Script de test non trouvé"
fi
echo ""

# 5. Redémarrer PM2
echo "5️⃣  Redémarrage de PM2..."
if command -v pm2 &> /dev/null; then
    pm2 restart all
    echo "✅ PM2 redémarré"
    echo ""
    echo "📊 Statut PM2:"
    pm2 status
    echo ""
    echo "📋 Pour voir les logs:"
    echo "   pm2 logs gestion-commerciale --lines 50"
else
    echo "⚠️  PM2 non installé"
fi
echo ""

# 6. Résumé
echo "📋 Résumé:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Prisma Client source: app/generated/prisma ($FILE_COUNT fichiers)"
if [ -d ".next/server/app/generated/prisma" ]; then
    BUILD_COUNT=$(find .next/server/app/generated/prisma -type f | wc -l)
    echo "✅ Prisma Client build: .next/server/app/generated/prisma ($BUILD_COUNT fichiers)"
else
    echo "⚠️  Prisma Client build: Non présent (sera créé au prochain build)"
fi
if [ -L "node_modules/.prisma/client" ]; then
    echo "✅ Lien symbolique: node_modules/.prisma/client -> app/generated/prisma"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "🎉 Configuration terminée!"
echo ""
echo "💡 Prochaines étapes:"
echo "   1. Tester l'authentification: node prisma/migrations/test-auth.js <email> <password>"
echo "   2. Tester depuis le navigateur"
echo "   3. Vérifier les logs si problème: pm2 logs gestion-commerciale --lines 50"

