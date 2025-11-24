#!/bin/bash

# Script pour résoudre le conflit Git sur le VPS
# Usage: ./resolve-conflict-vps.sh

set -e

echo "🔧 Résolution du conflit Git dans prisma/schema.prisma..."

# Vérifier qu'on est dans un dépôt Git
if [ ! -d .git ]; then
    echo "❌ Erreur: Ce script doit être exécuté dans le répertoire du projet Git"
    exit 1
fi

# Vérifier l'état Git
echo "📊 État Git actuel:"
git status --short

# Si un merge est en cours, accepter la version GitHub
if [ -f .git/MERGE_HEAD ]; then
    echo "🔄 Merge en cours détecté..."
    
    # Accepter la version GitHub (theirs) pour schema.prisma
    echo "✅ Acceptation de la version GitHub pour prisma/schema.prisma..."
    git checkout --theirs prisma/schema.prisma
    
    # Ajouter le fichier résolu
    git add prisma/schema.prisma
    
    # Finaliser le merge
    echo "💾 Finalisation du merge..."
    git commit -m "fix: Résolution du conflit dans schema.prisma - acceptation de la version GitHub" || {
        echo "⚠️  Le merge est peut-être déjà finalisé"
    }
else
    echo "⚠️  Aucun merge en cours. Tentative de pull..."
    git pull origin main || {
        echo "❌ Erreur lors du pull. Vérifiez manuellement."
        exit 1
    }
fi

# Régénérer le client Prisma
echo "🔄 Régénération du client Prisma..."
npx prisma generate

# Valider le schéma
echo "✅ Validation du schéma Prisma..."
npx prisma validate

echo "✅ Conflit résolu avec succès!"
echo "📝 N'oubliez pas de redémarrer l'application: pm2 restart all"

