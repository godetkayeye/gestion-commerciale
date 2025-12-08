#!/bin/bash

# Script pour corriger les problèmes d'authentification
# Usage: ./prisma/migrations/fix-auth.sh

set -e

echo "🔧 Correction des problèmes d'authentification..."
echo ""

# 1. Vérifier et copier Prisma Client dans le build
echo "1️⃣  Vérification de Prisma Client..."
if [ -d "app/generated/prisma" ] && [ -f "app/generated/prisma/client.ts" ]; then
    echo "✅ Prisma Client trouvé dans app/generated/prisma"
    
    if [ ! -d ".next/server/app/generated/prisma" ]; then
        echo "📦 Copie de Prisma Client dans le build..."
        mkdir -p .next/server/app/generated
        cp -r app/generated/prisma .next/server/app/generated/
        echo "✅ Prisma Client copié dans le build"
    else
        echo "✅ Prisma Client déjà présent dans le build"
    fi
else
    echo "⚠️  Prisma Client non trouvé, génération..."
    if [ -f "./prisma/migrations/generate-prisma-vps.sh" ]; then
        ./prisma/migrations/generate-prisma-vps.sh
        if [ -d "app/generated/prisma" ]; then
            mkdir -p .next/server/app/generated
            cp -r app/generated/prisma .next/server/app/generated/
            echo "✅ Prisma Client généré et copié"
        else
            echo "❌ Échec de la génération de Prisma Client"
            exit 1
        fi
    else
        echo "❌ Script de génération Prisma non trouvé"
        exit 1
    fi
fi
echo ""

# 2. Vérifier NEXTAUTH_SECRET
echo "2️⃣  Vérification de NEXTAUTH_SECRET..."
ENV_FILE=".env.local"
if [ ! -f "$ENV_FILE" ]; then
    ENV_FILE=".env"
fi

if [ -f "$ENV_FILE" ]; then
    if grep -q "NEXTAUTH_SECRET" "$ENV_FILE"; then
        echo "✅ NEXTAUTH_SECRET trouvé dans $ENV_FILE"
    else
        echo "⚠️  NEXTAUTH_SECRET manquant, génération d'un nouveau secret..."
        SECRET=$(openssl rand -base64 32 | tr -d '\n')
        echo "" >> "$ENV_FILE"
        echo "# NextAuth Secret" >> "$ENV_FILE"
        echo "NEXTAUTH_SECRET=$SECRET" >> "$ENV_FILE"
        echo "✅ NEXTAUTH_SECRET ajouté dans $ENV_FILE"
        echo "   Secret généré: $SECRET"
    fi
else
    echo "⚠️  Aucun fichier .env trouvé, création..."
    SECRET=$(openssl rand -base64 32 | tr -d '\n')
    cat > "$ENV_FILE" << EOF
# NextAuth Secret
NEXTAUTH_SECRET=$SECRET

# Database URL (à compléter)
# DATABASE_URL=mysql://user:password@host:3306/database
EOF
    echo "✅ Fichier $ENV_FILE créé avec NEXTAUTH_SECRET"
    echo "   ⚠️  N'oubliez pas d'ajouter DATABASE_URL dans $ENV_FILE"
fi
echo ""

# 3. Vérifier DATABASE_URL
echo "3️⃣  Vérification de DATABASE_URL..."
if [ -f "$ENV_FILE" ]; then
    if grep -q "DATABASE_URL" "$ENV_FILE" && ! grep -q "^#.*DATABASE_URL" "$ENV_FILE"; then
        echo "✅ DATABASE_URL trouvé dans $ENV_FILE"
    else
        echo "⚠️  DATABASE_URL manquant ou commenté dans $ENV_FILE"
        echo "   Veuillez l'ajouter manuellement"
    fi
fi
echo ""

# 4. Tester la connexion Prisma
echo "4️⃣  Test de connexion Prisma..."
if [ -f "prisma/migrations/test-prisma-simple.js" ]; then
    if node prisma/migrations/test-prisma-simple.js 2>/dev/null; then
        echo "✅ Connexion Prisma OK"
    else
        echo "⚠️  Échec de la connexion Prisma (vérifiez DATABASE_URL)"
    fi
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

echo "🎉 Correction terminée!"
echo ""
echo "💡 Si l'authentification ne fonctionne toujours pas:"
echo "   1. Vérifiez que les mots de passe sont hashés avec bcrypt en production"
echo "   2. Vérifiez les logs: pm2 logs gestion-commerciale"
echo "   3. Exécutez le diagnostic: ./prisma/migrations/diagnose-auth.sh"

