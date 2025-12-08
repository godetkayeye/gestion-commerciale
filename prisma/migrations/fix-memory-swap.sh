#!/bin/bash

# Script pour créer un fichier swap et redémarrer PM2
# Usage: ./fix-memory-swap.sh

set -e

echo "🔧 Correction du problème de mémoire..."
echo ""

# Vérifier si le swap existe déjà
if swapon --show | grep -q "/swapfile"; then
    echo "✅ Un fichier swap existe déjà"
    swapon --show
else
    echo "📦 Création d'un fichier swap de 2GB..."
    
    # Vérifier l'espace disque disponible
    AVAILABLE=$(df -BG / | tail -1 | awk '{print $4}' | sed 's/G//')
    if [ "$AVAILABLE" -lt 3 ]; then
        echo "⚠️  Espace disque limité. Création d'un swap de 1GB au lieu de 2GB..."
        SWAP_SIZE="1G"
    else
        SWAP_SIZE="2G"
    fi
    
    # Créer le fichier swap
    sudo fallocate -l $SWAP_SIZE /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    
    # Rendre le swap permanent (ajouter à /etc/fstab)
    if ! grep -q "/swapfile" /etc/fstab; then
        echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab
        echo "✅ Swap ajouté à /etc/fstab (permanent)"
    fi
    
    echo "✅ Fichier swap créé et activé"
fi

echo ""
echo "💾 État de la mémoire après création du swap:"
free -h

echo ""
echo "🔄 Redémarrage de PM2..."

cd /var/www/ghostapp/gestion-commerciale

# Arrêter PM2
pm2 stop all 2>/dev/null || true

# Attendre un peu pour libérer la mémoire
sleep 2

# Redémarrer PM2
pm2 start ecosystem.config.js || pm2 restart all

# Sauvegarder la configuration
pm2 save

echo ""
echo "✅ PM2 redémarré"
echo ""
echo "📊 Statut PM2:"
pm2 status

echo ""
echo "💡 Vérifiez les logs avec: pm2 logs gestion-commerciale --lines 30"

