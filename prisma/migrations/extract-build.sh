#!/bin/bash

# Script à exécuter sur le VPS pour extraire le build .next
# Usage: ./extract-build.sh

set -e

echo "📦 Extraction du build .next..."

# Vérifier que l'archive existe
if [ ! -f ".next.tar.gz" ]; then
    echo "❌ Le fichier .next.tar.gz n'existe pas."
    echo "   Transférez d'abord l'archive depuis votre machine locale:"
    echo "   scp .next.tar.gz ghost@srv1129427:/var/www/ghostapp/gestion-commerciale/"
    exit 1
fi

# Arrêter PM2
echo "🛑 Arrêt de PM2..."
pm2 stop all || true

# Sauvegarder l'ancien .next si il existe
if [ -d ".next" ]; then
    echo "💾 Sauvegarde de l'ancien .next..."
    rm -rf .next.old
    mv .next .next.old
fi

# Extraire le nouveau build
echo "📦 Extraction de .next.tar.gz..."
tar -xzf .next.tar.gz

# Vérifier que l'extraction a réussi
if [ ! -d ".next" ]; then
    echo "❌ Erreur lors de l'extraction. Restauration de l'ancien build..."
    if [ -d ".next.old" ]; then
        mv .next.old .next
    fi
    exit 1
fi

# Supprimer l'ancien build
if [ -d ".next.old" ]; then
    echo "🗑️  Suppression de l'ancien build..."
    rm -rf .next.old
fi

# Redémarrer PM2
echo "🚀 Redémarrage de PM2..."
pm2 start all

echo "✅ Build déployé avec succès!"
echo ""
echo "📊 Vérifiez le statut avec: pm2 status"
echo "📋 Vérifiez les logs avec: pm2 logs gestion-commerciale --lines 30"

