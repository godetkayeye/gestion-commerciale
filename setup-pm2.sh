#!/bin/bash
# Script pour configurer PM2 correctement avec démarrage automatique

echo "🔧 Configuration de PM2 pour gestion-commerciale..."

cd /var/www/ghostapp/gestion-commerciale

# Créer le dossier de logs s'il n'existe pas
mkdir -p logs

# Arrêter toutes les instances PM2 existantes
echo "⏹️  Arrêt des instances PM2 existantes..."
pm2 delete all 2>/dev/null || true

# Démarrer l'application avec PM2 en utilisant le fichier ecosystem.config.js
echo "🚀 Démarrage de l'application avec PM2..."
pm2 start ecosystem.config.js

# Sauvegarder la configuration PM2 (pour le démarrage automatique au boot)
echo "💾 Sauvegarde de la configuration PM2..."
pm2 save

# Configurer PM2 pour démarrer automatiquement au boot du système
echo "🔄 Configuration du démarrage automatique au boot..."
pm2 startup

echo ""
echo "✅ Configuration terminée !"
echo ""
echo "📊 Commandes utiles :"
echo "   - pm2 status          : Voir le statut des applications"
echo "   - pm2 logs            : Voir les logs en temps réel"
echo "   - pm2 restart all     : Redémarrer toutes les applications"
echo "   - pm2 stop all        : Arrêter toutes les applications"
echo "   - pm2 monit           : Monitorer les ressources (CPU, mémoire)"
echo ""
echo "📝 Logs disponibles dans : /var/www/ghostapp/gestion-commerciale/logs/"

