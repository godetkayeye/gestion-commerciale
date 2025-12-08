#!/bin/bash

# Script pour copier Prisma Client généré localement vers le VPS
# Usage: ./prisma/migrations/copy-prisma-from-local.sh <user@vps-ip>

set -e

VPS_TARGET="${1:-ghost@72.61.109.17}"
VPS_PATH="/var/www/ghostapp/gestion-commerciale"

echo "📦 Copie de Prisma Client depuis la machine locale vers le VPS..."
echo "   VPS: $VPS_TARGET"
echo "   Chemin: $VPS_PATH"
echo ""

# Vérifier que Prisma Client existe localement
if [ ! -d "app/generated/prisma" ]; then
    echo "❌ Prisma Client non trouvé localement dans app/generated/prisma"
    echo "   Génération de Prisma Client localement..."
    npx prisma generate
fi

if [ ! -d "app/generated/prisma" ] || [ ! -f "app/generated/prisma/client.ts" ]; then
    echo "❌ Échec de la génération locale de Prisma Client"
    exit 1
fi

echo "✅ Prisma Client trouvé localement"
FILE_COUNT=$(find app/generated/prisma -type f | wc -l)
echo "   Fichiers: $FILE_COUNT"
echo ""

# Créer une archive temporaire
echo "📦 Création d'une archive..."
TEMP_ARCHIVE=$(mktemp -d)/prisma-client.tar.gz
tar -czf "$TEMP_ARCHIVE" -C app/generated prisma
ARCHIVE_SIZE=$(du -h "$TEMP_ARCHIVE" | cut -f1)
echo "✅ Archive créée: $ARCHIVE_SIZE"
echo ""

# Copier vers le VPS
echo "📤 Copie vers le VPS..."
scp "$TEMP_ARCHIVE" "$VPS_TARGET:/tmp/prisma-client.tar.gz"

# Extraire sur le VPS
echo "📦 Extraction sur le VPS..."
ssh "$VPS_TARGET" << 'ENDSSH'
cd /var/www/ghostapp/gestion-commerciale

# Sauvegarder l'ancien si existe
if [ -d "app/generated/prisma" ]; then
    if [ -d "app/generated/prisma.backup" ]; then
        rm -rf app/generated/prisma.backup
    fi
    mv app/generated/prisma app/generated/prisma.backup
    echo "✅ Ancien Prisma Client sauvegardé"
fi

# Extraire le nouveau
mkdir -p app/generated
cd app/generated
tar -xzf /tmp/prisma-client.tar.gz
rm /tmp/prisma-client.tar.gz

echo "✅ Prisma Client extrait dans app/generated/prisma"

# Copier dans le build si existe
if [ -d "../.next/server/app/generated" ]; then
    mkdir -p ../.next/server/app/generated
    if [ -d "../.next/server/app/generated/prisma" ]; then
        rm -rf ../.next/server/app/generated/prisma
    fi
    cp -r prisma ../.next/server/app/generated/
    echo "✅ Prisma Client copié dans le build"
fi

# Vérifier
FILE_COUNT=$(find prisma -type f | wc -l)
echo "✅ Fichiers copiés: $FILE_COUNT"

# Redémarrer PM2
if command -v pm2 &> /dev/null; then
    pm2 restart all
    echo "✅ PM2 redémarré"
fi
ENDSSH

# Nettoyer
rm -f "$TEMP_ARCHIVE"
rmdir "$(dirname "$TEMP_ARCHIVE")" 2>/dev/null || true

echo ""
echo "🎉 Copie terminée avec succès!"
echo ""
echo "💡 Pour tester sur le VPS:"
echo "   node prisma/migrations/test-prisma-simple.js"

