#!/bin/bash

# Script de diagnostic pour les problèmes d'authentification
# Usage: ./prisma/migrations/diagnose-auth.sh

set -e

echo "🔍 Diagnostic des problèmes d'authentification..."
echo ""

# 1. Vérifier Prisma Client
echo "1️⃣  Vérification de Prisma Client..."
if [ -d "app/generated/prisma" ]; then
    if [ -f "app/generated/prisma/client.ts" ]; then
        echo "✅ Prisma Client trouvé dans app/generated/prisma"
    else
        echo "❌ Prisma Client manquant dans app/generated/prisma"
    fi
else
    echo "❌ Dossier app/generated/prisma manquant"
fi

if [ -d ".next/server/app/generated/prisma" ]; then
    if [ -f ".next/server/app/generated/prisma/client.ts" ]; then
        echo "✅ Prisma Client trouvé dans le build (.next/server/app/generated/prisma)"
    else
        echo "⚠️  Prisma Client manquant dans le build"
        echo "   Solution: Copier depuis app/generated/prisma"
    fi
else
    echo "⚠️  Dossier .next/server/app/generated/prisma manquant dans le build"
fi
echo ""

# 2. Vérifier les variables d'environnement
echo "2️⃣  Vérification des variables d'environnement..."
if [ -f ".env.local" ] || [ -f ".env" ]; then
    echo "✅ Fichier .env trouvé"
    
    if grep -q "NEXTAUTH_SECRET" .env.local 2>/dev/null || grep -q "NEXTAUTH_SECRET" .env 2>/dev/null; then
        echo "✅ NEXTAUTH_SECRET trouvé dans .env"
    else
        echo "❌ NEXTAUTH_SECRET manquant dans .env"
        echo "   Solution: Ajouter NEXTAUTH_SECRET=..."
    fi
    
    if grep -q "DATABASE_URL" .env.local 2>/dev/null || grep -q "DATABASE_URL" .env 2>/dev/null; then
        echo "✅ DATABASE_URL trouvé dans .env"
    else
        echo "❌ DATABASE_URL manquant dans .env"
    fi
else
    echo "❌ Aucun fichier .env trouvé"
    echo "   Solution: Créer .env.local avec NEXTAUTH_SECRET et DATABASE_URL"
fi
echo ""

# 3. Tester la connexion Prisma
echo "3️⃣  Test de connexion Prisma..."
if [ -f "prisma/migrations/test-prisma-simple.js" ]; then
    echo "🧪 Exécution du test Prisma..."
    node prisma/migrations/test-prisma-simple.js
    if [ $? -eq 0 ]; then
        echo "✅ Connexion Prisma OK"
    else
        echo "❌ Échec de la connexion Prisma"
    fi
else
    echo "⚠️  Script de test Prisma non trouvé"
fi
echo ""

# 4. Vérifier les logs PM2
echo "4️⃣  Vérification des logs PM2 (dernières erreurs)..."
if command -v pm2 &> /dev/null; then
    echo "📋 Dernières erreurs dans les logs:"
    pm2 logs gestion-commerciale --lines 20 --nostream 2>/dev/null | grep -i "error\|prisma\|auth\|nextauth" | tail -10 || echo "   Aucune erreur récente trouvée"
else
    echo "⚠️  PM2 non installé"
fi
echo ""

# 5. Vérifier les mots de passe hashés
echo "5️⃣  Vérification des mots de passe dans la base de données..."
echo "   (Cette vérification nécessite une connexion à la base de données)"
echo "   Exécutez cette requête SQL pour vérifier:"
echo "   SELECT email, mot_de_passe, LENGTH(mot_de_passe) as pwd_length FROM utilisateur LIMIT 5;"
echo "   Les mots de passe hashés avec bcrypt font généralement 60 caractères"
echo ""

# 6. Résumé et recommandations
echo "📋 Résumé et recommandations:"
echo ""
echo "Si Prisma Client manque dans le build:"
echo "   1. Générer Prisma: ./prisma/migrations/generate-prisma-vps.sh"
echo "   2. Ou copier depuis app/generated/prisma vers .next/server/app/generated/prisma"
echo ""
echo "Si NEXTAUTH_SECRET manque:"
echo "   1. Générer un secret: openssl rand -base64 32"
echo "   2. Ajouter dans .env.local: NEXTAUTH_SECRET=<votre-secret>"
echo "   3. Redémarrer PM2: pm2 restart all"
echo ""
echo "Si les mots de passe ne sont pas hashés:"
echo "   1. Les mots de passe doivent être hashés avec bcrypt en production"
echo "   2. La tolérance DEV ne fonctionne qu'en développement"
echo ""

