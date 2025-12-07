#!/bin/bash
# Script pour builder l'application avec swap temporaire

echo "🔧 Création d'un fichier swap de 2GB..."

# Créer le fichier swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

echo "✅ Swap activé. Mémoire disponible:"
free -h

echo "🔨 Démarrage du build..."
npm run build

BUILD_STATUS=$?

echo "🧹 Nettoyage du swap..."
sudo swapoff /swapfile
sudo rm /swapfile

if [ $BUILD_STATUS -eq 0 ]; then
    echo "✅ Build réussi!"
    echo "🔄 Redémarrage de PM2..."
    pm2 restart all
else
    echo "❌ Build échoué. Vérifiez les logs ci-dessus."
    exit 1
fi

