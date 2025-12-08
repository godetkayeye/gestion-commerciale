#!/bin/bash

# Script pour extraire le build sur le VPS
# Usage: ./prisma/migrations/extract-build-vps.sh

set -e

echo "📦 Extraction du build Next.js sur le VPS..."
echo ""

# Vérifier que les parties existent
if [ ! -f ".next.tar.gz.part1" ]; then
    echo "❌ Aucune partie de l'archive trouvée. Récupérez d'abord avec: git pull origin main"
    exit 1
fi

# 1. Arrêter PM2
echo "⏹️  Étape 1/4: Arrêt de PM2..."
pm2 stop all || true
echo "✅ PM2 arrêté"
echo ""

# 2. Assembler les parties
echo "📦 Étape 2/4: Assemblage de l'archive..."
if [ -f ".next.tar.gz" ]; then
    rm .next.tar.gz
    echo "🗑️  Ancienne archive supprimée"
fi

cat .next.tar.gz.part* > .next.tar.gz
echo "✅ Archive assemblée: .next.tar.gz ($(du -h .next.tar.gz | cut -f1))"
echo ""

# 3. Sauvegarder l'ancien .next (optionnel)
if [ -d ".next" ]; then
    echo "💾 Étape 3/4: Sauvegarde de l'ancien build..."
    if [ -d ".next.backup" ]; then
        rm -rf .next.backup
    fi
    mv .next .next.backup
    echo "✅ Ancien build sauvegardé dans .next.backup"
else
    echo "💾 Étape 3/4: Pas d'ancien build à sauvegarder"
fi
echo ""

# 4. Extraire la nouvelle archive
echo "📦 Étape 4/4: Extraction du nouveau build..."
tar -xzf .next.tar.gz
echo "✅ Build extrait"
echo ""

# 5. Vérifier que Prisma Client est présent
echo "🔍 Vérification de Prisma Client dans le build..."
if [ -d ".next/server/app/generated/prisma" ]; then
    echo "✅ Prisma Client trouvé dans le build"
else
    echo "⚠️  Prisma Client non trouvé, copie depuis app/generated/prisma..."
    mkdir -p .next/server/app/generated
    if [ -d "app/generated/prisma" ]; then
        cp -r app/generated/prisma .next/server/app/generated/
        echo "✅ Prisma Client copié"
    else
        echo "❌ Prisma Client non trouvé. Générez-le avec: npx prisma generate"
        exit 1
    fi
fi
echo ""

# 6. Redémarrer PM2
echo "🚀 Redémarrage de PM2..."
pm2 restart all
echo "✅ PM2 redémarré"
echo ""

echo "🎉 Déploiement terminé avec succès!"
echo ""
echo "📊 Vérification du statut:"
pm2 status
echo ""
echo "📋 Logs:"
echo "   pm2 logs gestion-commerciale --lines 50"

