#!/bin/bash

# Script pour builder localement et préparer le déploiement sur VPS
# Usage: ./build-local.sh

set -e

echo "🔧 Build local pour déploiement VPS..."
echo ""

# 1. Générer Prisma Client
echo "📦 Étape 1/4: Génération de Prisma Client..."
npx prisma generate
echo "✅ Prisma Client généré"
echo ""

# 2. Build Next.js
echo "📦 Étape 2/4: Build Next.js..."
npm run build
echo "✅ Build Next.js terminé"
echo ""

# 3. Vérifier que Prisma Client est dans le build
echo "📦 Étape 3/4: Vérification de Prisma Client dans le build..."
if [ -d ".next/server/app/generated/prisma" ]; then
    echo "✅ Prisma Client trouvé dans .next/server/app/generated/prisma"
else
    echo "⚠️  Prisma Client non trouvé dans le build, copie manuelle..."
    mkdir -p .next/server/app/generated
    cp -r app/generated/prisma .next/server/app/generated/
    echo "✅ Prisma Client copié manuellement"
fi
echo ""

# 4. Créer l'archive
echo "📦 Étape 4/4: Création de l'archive .next.tar.gz..."
if [ -f ".next.tar.gz" ]; then
    rm .next.tar.gz
    echo "🗑️  Ancienne archive supprimée"
fi

tar -czf .next.tar.gz .next/
ARCHIVE_SIZE=$(du -h .next.tar.gz | cut -f1)
echo "✅ Archive créée: .next.tar.gz ($ARCHIVE_SIZE)"
echo ""

# 5. Diviser l'archive en parties (pour transfert via Git si nécessaire)
echo "📦 Division de l'archive en parties de 50MB..."
if [ -f ".next.tar.gz.part1" ]; then
    rm .next.tar.gz.part*
    echo "🗑️  Anciennes parties supprimées"
fi

split -b 50M .next.tar.gz .next.tar.gz.part
PART_COUNT=$(ls -1 .next.tar.gz.part* 2>/dev/null | wc -l)
echo "✅ Archive divisée en $PART_COUNT partie(s)"
echo ""

echo "🎉 Build terminé avec succès!"
echo ""
echo "📤 Prochaines étapes pour déployer sur le VPS:"
echo ""
echo "1. Pousser les parties vers Git:"
echo "   git add .next.tar.gz.part*"
echo "   git commit -m 'Build Next.js avec Prisma Client'"
echo "   git push origin main"
echo ""
echo "2. Sur le VPS, récupérer et assembler:"
echo "   git pull origin main"
echo "   cat .next.tar.gz.part* > .next.tar.gz"
echo "   tar -xzf .next.tar.gz"
echo "   pm2 restart all"
echo ""
echo "OU utiliser SCP directement (si vous avez l'IP):"
echo "   scp .next.tar.gz ghost@[IP]:/var/www/ghostapp/gestion-commerciale/"
echo ""

