#!/bin/bash

# Script pour extraire le build sur le VPS
# Usage: ./prisma/migrations/extract-build-vps.sh

set -e

echo "📦 Extraction du build Next.js sur le VPS..."
echo ""

# Vérifier que les parties existent
PART_COUNT=$(ls -1 .next.tar.gz.part* 2>/dev/null | wc -l)
if [ "$PART_COUNT" -eq 0 ]; then
    echo "❌ Aucune partie de l'archive trouvée. Récupérez d'abord avec: git pull origin main"
    exit 1
fi
echo "✅ $PART_COUNT partie(s) de l'archive trouvée(s)"

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
    echo "⚠️  Prisma Client non trouvé dans le build, tentative de copie depuis app/generated/prisma..."
    mkdir -p .next/server/app/generated
    if [ -d "app/generated/prisma" ]; then
        cp -r app/generated/prisma .next/server/app/generated/
        echo "✅ Prisma Client copié depuis app/generated/prisma"
    else
        echo "⚠️  Prisma Client non trouvé localement"
        echo ""
        echo "💡 Options disponibles:"
        echo "   1. Générer Prisma Client maintenant (peut nécessiter beaucoup de mémoire):"
        echo "      ./prisma/migrations/generate-prisma-vps.sh"
        echo ""
        echo "   2. Ou utiliser le build pré-compilé qui devrait contenir Prisma"
        echo ""
        read -p "Voulez-vous générer Prisma Client maintenant? (o/N): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[OoYy]$ ]]; then
            ./prisma/migrations/generate-prisma-vps.sh
            if [ -d "app/generated/prisma" ]; then
                mkdir -p .next/server/app/generated
                cp -r app/generated/prisma .next/server/app/generated/
                echo "✅ Prisma Client copié dans le build"
            else
                echo "❌ Échec de la génération de Prisma Client"
                exit 1
            fi
        else
            echo "❌ Prisma Client requis. Déploiement interrompu."
            exit 1
        fi
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

