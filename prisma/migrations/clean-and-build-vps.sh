#!/bin/bash

# Script pour nettoyer et faire le build sur le VPS
# Usage: ./clean-and-build-vps.sh

set -e

echo "🧹 Nettoyage et préparation pour le build..."
echo ""

cd /var/www/ghostapp/gestion-commerciale

# 1. Nettoyer les anciens builds
echo "🗑️  1. Suppression des anciens builds..."
rm -rf .next.old* 2>/dev/null || true
rm -f .next.tar.gz .next.tar.gz.part* 2>/dev/null || true
echo "✅ Anciens builds supprimés"
echo ""

# 2. Vérifier et augmenter le swap si nécessaire
echo "💾 2. Vérification du swap..."
CURRENT_SWAP=$(swapon --show | grep -c "/swapfile" || echo "0")
SWAP_SIZE=$(swapon --show | grep "/swapfile" | awk '{print $3}' | sed 's/G//' || echo "0")

if [ "$CURRENT_SWAP" -eq 0 ] || [ "$SWAP_SIZE" -lt 4 ]; then
    echo "📦 Augmentation du swap à 4GB..."
    
    # Désactiver l'ancien swap si < 4GB
    if [ "$CURRENT_SWAP" -eq 1 ]; then
        sudo swapoff /swapfile 2>/dev/null || true
        sudo rm -f /swapfile
    fi
    
    # Créer un nouveau swap de 4GB
    sudo fallocate -l 4G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    
    # Mettre à jour /etc/fstab
    sudo sed -i '/\/swapfile/d' /etc/fstab
    echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab
    
    echo "✅ Swap de 4GB créé et activé"
else
    echo "✅ Swap déjà configuré ($SWAP_SIZE GB)"
fi

echo ""
echo "💾 État de la mémoire:"
free -h
echo ""

# 3. Nettoyer node_modules et réinstaller (optionnel, commenté par défaut)
# echo "📦 3. Nettoyage de node_modules..."
# rm -rf node_modules package-lock.json
# npm install

# 4. Arrêter PM2 pour libérer de la mémoire
echo "⏹️  4. Arrêt de PM2 pour libérer de la mémoire..."
pm2 stop all 2>/dev/null || true
sleep 2

# 5. Libérer le cache système
echo "🧹 5. Libération du cache système..."
sudo sync
sudo sysctl vm.drop_caches=3 >/dev/null 2>&1 || true
sleep 2

echo ""
echo "💾 Mémoire disponible après nettoyage:"
free -h
echo ""

# 6. Générer Prisma Client
echo "🔧 6. Génération du client Prisma..."
echo "   (Cela peut prendre quelques minutes avec swap...)"
NODE_OPTIONS="--max-old-space-size=1024" npx prisma generate || {
    echo "❌ Échec de prisma generate"
    echo "💡 Solution alternative: générer localement et transférer"
    exit 1
}
echo "✅ Prisma Client généré"
echo ""

# 7. Build Next.js
echo "🏗️  7. Build de l'application Next.js..."
echo "   (Cela peut prendre 10-15 minutes avec swap...)"
NODE_OPTIONS="--max-old-space-size=1024" npm run build || {
    echo "❌ Échec du build"
    echo "💡 Solution alternative: build localement et transférer avec split-build.sh"
    exit 1
}
echo "✅ Build terminé"
echo ""

# 8. Redémarrer PM2
echo "🚀 8. Redémarrage de PM2..."
pm2 start ecosystem.config.js
pm2 save

echo ""
echo "✅ Tout est terminé !"
echo ""
echo "📊 Statut PM2:"
pm2 status

echo ""
echo "💡 Vérifiez les logs avec: pm2 logs gestion-commerciale --lines 30"

