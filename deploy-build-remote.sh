#!/bin/bash

# Script pour créer l'archive et la rendre disponible pour téléchargement
# Usage: ./deploy-build-remote.sh

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

echo "✅ Archive créée: .next.tar.gz ($(du -h .next.tar.gz | cut -f1))"
echo ""
echo "📤 Options de transfert:"
echo ""
echo "1. Via SCP avec l'adresse IP:"
echo "   scp .next.tar.gz ghost@[IP_ADRESSE]:/var/www/ghostapp/gestion-commerciale/"
echo ""
echo "2. Via HTTP (si vous avez un serveur web):"
echo "   python3 -m http.server 8000"
echo "   # Puis sur le VPS: wget http://[VOTRE_IP]:8000/.next.tar.gz"
echo ""
echo "3. Via un service de stockage temporaire (transfer.sh, etc.)"
echo "   curl --upload-file .next.tar.gz https://transfer.sh/.next.tar.gz"
echo "   # Puis sur le VPS: wget [URL_GENEREE]"
echo ""

