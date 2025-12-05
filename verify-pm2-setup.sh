#!/bin/bash
# Script de vérification de la configuration PM2

echo "🔍 Vérification de la configuration PM2..."
echo ""

# Vérifier le statut PM2
echo "📊 Statut PM2 :"
pm2 status
echo ""

# Vérifier que le service systemd est activé
echo "🔧 Service systemd :"
systemctl is-enabled pm2-ghost.service 2>/dev/null && echo "✅ Service pm2-ghost est activé" || echo "❌ Service pm2-ghost n'est pas activé"
echo ""

# Vérifier l'état du service
echo "📋 État du service :"
systemctl status pm2-ghost.service --no-pager -l | head -n 10
echo ""

# Vérifier les logs récents
echo "📝 Dernières lignes des logs PM2 :"
pm2 logs gestion-commerciale --lines 5 --nostream 2>/dev/null || echo "Aucun log disponible"
echo ""

echo "✅ Vérification terminée !"
echo ""
echo "💡 Commandes utiles :"
echo "   - pm2 status          : Voir le statut"
echo "   - pm2 logs            : Voir les logs en temps réel"
echo "   - pm2 monit           : Monitorer les ressources"
echo "   - systemctl status pm2-ghost.service : Voir l'état du service systemd"

