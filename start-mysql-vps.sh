#!/bin/bash

# Script pour démarrer MySQL et s'assurer qu'il démarre au boot
# Usage: bash start-mysql-vps.sh

echo "=== Démarrage et configuration de MySQL ==="
echo ""

# Détecter le service MySQL
MYSQL_SERVICE=""
if systemctl list-unit-files | grep -q "^mysql.service"; then
    MYSQL_SERVICE="mysql"
elif systemctl list-unit-files | grep -q "^mysqld.service"; then
    MYSQL_SERVICE="mysqld"
elif systemctl list-unit-files | grep -q "^mariadb.service"; then
    MYSQL_SERVICE="mariadb"
else
    echo "✗ Aucun service MySQL/MariaDB trouvé"
    echo "  Vérifiez que MySQL est installé:"
    echo "    sudo apt-get install mysql-server"
    echo "    # ou"
    echo "    sudo yum install mysql-server"
    exit 1
fi

echo "Service détecté: $MYSQL_SERVICE"
echo ""

# Démarrer MySQL
echo "1. Démarrage de MySQL..."
if systemctl is-active --quiet $MYSQL_SERVICE; then
    echo "   ✓ MySQL est déjà en cours d'exécution"
else
    echo "   → Démarrage de MySQL..."
    if sudo systemctl start $MYSQL_SERVICE; then
        echo "   ✓ MySQL démarré avec succès"
    else
        echo "   ✗ Échec du démarrage de MySQL"
        echo "   Vérifiez les logs: sudo journalctl -u $MYSQL_SERVICE -n 50"
        exit 1
    fi
fi
echo ""

# Activer MySQL au démarrage
echo "2. Configuration du démarrage automatique..."
if systemctl is-enabled --quiet $MYSQL_SERVICE; then
    echo "   ✓ MySQL est déjà configuré pour démarrer automatiquement"
else
    echo "   → Activation du démarrage automatique..."
    if sudo systemctl enable $MYSQL_SERVICE; then
        echo "   ✓ MySQL sera démarré automatiquement au boot"
    else
        echo "   ⚠ Impossible d'activer le démarrage automatique"
    fi
fi
echo ""

# Vérifier le statut
echo "3. Vérification du statut..."
systemctl status $MYSQL_SERVICE --no-pager | head -10
echo ""

# Tester la connexion
echo "4. Test de connexion..."
sleep 2
if mysql -u ghostuser -p'password123!' -h localhost -e "SELECT 1;" gestion_commerciale 2>/dev/null; then
    echo "   ✓ Connexion réussie !"
else
    echo "   ⚠ Connexion échouée (normal si l'utilisateur ou la base n'existe pas encore)"
    echo "   MySQL est démarré, mais vérifiez les identifiants dans ecosystem.config.js"
fi
echo ""

echo "=== Terminé ==="
echo ""
echo "Pour redémarrer l'application:"
echo "  pm2 restart gestion-commerciale"
echo "  pm2 logs gestion-commerciale --lines 30"

