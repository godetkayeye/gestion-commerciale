#!/bin/bash

# Script pour archiver et transférer le build .next vers le VPS
# Usage: ./deploy-build.sh [user@host] [remote-path]

set -e

echo "📦 Préparation du build pour déploiement..."

# Vérifier que le build existe
if [ ! -d ".next" ]; then
    echo "❌ Le dossier .next n'existe pas. Lancez d'abord: npm run build"
    exit 1
fi

# Créer l'archive
echo "📦 Création de l'archive .next.tar.gz..."
tar -czf .next.tar.gz .next/

echo "✅ Archive créée: .next.tar.gz"
echo ""
echo "📤 Pour transférer vers le VPS, utilisez:"
echo "   scp .next.tar.gz ghost@srv1129427:/var/www/ghostapp/gestion-commerciale/"
echo ""
echo "📥 Puis sur le VPS, exécutez:"
echo "   cd /var/www/ghostapp/gestion-commerciale"
echo "   tar -xzf .next.tar.gz"
echo "   pm2 restart all"
echo ""

# Si les arguments sont fournis, transférer automatiquement
if [ -n "$1" ] && [ -n "$2" ]; then
    echo "🚀 Transfert automatique vers $1:$2..."
    scp .next.tar.gz "$1:$2"
    echo "✅ Transfert terminé!"
    echo ""
    echo "📥 Connectez-vous au VPS et exécutez:"
    echo "   cd $2"
    echo "   tar -xzf .next.tar.gz"
    echo "   pm2 restart all"
fi

