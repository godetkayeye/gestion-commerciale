#!/bin/bash
# Script pour mettre à jour le VPS et corriger les erreurs de build

echo "🔄 Mise à jour du dépôt Git..."
cd /var/www/ghostapp/gestion-commerciale
git fetch origin
git pull origin main

echo "🧹 Nettoyage du cache Next.js..."
rm -rf .next

echo "🔧 Régénération du client Prisma..."
npx prisma generate

echo "🏗️  Build de l'application..."
npm run build

echo "✅ Mise à jour terminée !"

