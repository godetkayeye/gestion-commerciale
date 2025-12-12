#!/bin/bash

echo "=== Diagnostic MySQL sur le VPS ==="
echo ""

# 1. Vérifier si MySQL est en cours d'exécution
echo "1. Vérification du service MySQL..."
MYSQL_SERVICE=""
if systemctl is-active --quiet mysql 2>/dev/null; then
    MYSQL_SERVICE="mysql"
elif systemctl is-active --quiet mysqld 2>/dev/null; then
    MYSQL_SERVICE="mysqld"
elif systemctl is-active --quiet mariadb 2>/dev/null; then
    MYSQL_SERVICE="mariadb"
fi

if [ -n "$MYSQL_SERVICE" ]; then
    echo "   ✓ MySQL/MariaDB est en cours d'exécution (service: $MYSQL_SERVICE)"
    systemctl status $MYSQL_SERVICE 2>/dev/null | head -3
    # Vérifier si le service est activé au démarrage
    if systemctl is-enabled --quiet $MYSQL_SERVICE 2>/dev/null; then
        echo "   ✓ MySQL est configuré pour démarrer automatiquement au boot"
    else
        echo "   ⚠ MySQL n'est PAS configuré pour démarrer automatiquement"
        echo "   → Pour activer: sudo systemctl enable $MYSQL_SERVICE"
    fi
else
    echo "   ✗ MySQL/MariaDB n'est PAS en cours d'exécution"
    echo "   → Démarrer MySQL:"
    echo "     sudo systemctl start mysql"
    echo "     # ou"
    echo "     sudo systemctl start mysqld"
    echo "     # ou"
    echo "     sudo systemctl start mariadb"
    echo ""
    echo "   → Pour démarrer automatiquement au boot:"
    echo "     sudo systemctl enable mysql (ou mysqld ou mariadb)"
fi
echo ""

# 2. Vérifier si le port 3306 est ouvert
echo "2. Vérification du port 3306..."
if netstat -tuln 2>/dev/null | grep -q ":3306 " || ss -tuln 2>/dev/null | grep -q ":3306 "; then
    echo "   ✓ Le port 3306 est ouvert"
else
    echo "   ✗ Le port 3306 n'est PAS ouvert"
fi
echo ""

# 3. Tester la connexion MySQL
echo "3. Test de connexion MySQL..."
if command -v mysql &> /dev/null; then
    if mysql -u ghostuser -p'password123!' -h localhost -P 3306 -e "SELECT 1;" gestion_commerciale 2>/dev/null; then
        echo "   ✓ Connexion réussie avec les identifiants de ecosystem.config.js"
    else
        echo "   ✗ Échec de la connexion avec les identifiants de ecosystem.config.js"
        echo "   → Vérifiez les identifiants dans ecosystem.config.js"
        echo "   → Essayez de vous connecter manuellement:"
        echo "     mysql -u ghostuser -p -h localhost gestion_commerciale"
    fi
else
    echo "   ⚠ Le client MySQL n'est pas installé (normal si vous n'avez pas besoin de l'utiliser directement)"
fi
echo ""

# 4. Vérifier si la base de données existe
echo "4. Vérification de la base de données..."
if command -v mysql &> /dev/null; then
    if mysql -u ghostuser -p'password123!' -h localhost -P 3306 -e "USE gestion_commerciale;" 2>/dev/null; then
        echo "   ✓ La base de données 'gestion_commerciale' existe"
    else
        echo "   ✗ La base de données 'gestion_commerciale' n'existe pas ou n'est pas accessible"
        echo "   → Créez-la avec: CREATE DATABASE gestion_commerciale;"
    fi
else
    echo "   ⚠ Impossible de vérifier (client MySQL non installé)"
fi
echo ""

# 5. Vérifier les variables d'environnement PM2
echo "5. Vérification des variables d'environnement PM2..."
if pm2 describe gestion-commerciale &>/dev/null; then
    echo "   Variables d'environnement de l'application:"
    pm2 describe gestion-commerciale | grep -A 20 "env:" || echo "   ⚠ Impossible de récupérer les variables"
else
    echo "   ✗ L'application PM2 'gestion-commerciale' n'est pas trouvée"
fi
echo ""

# 6. Suggestions
echo "=== Suggestions ==="
echo ""
echo "Si MySQL n'est pas démarré:"
echo "  sudo systemctl start mysql"
echo "  # ou"
echo "  sudo systemctl start mysqld"
echo ""
echo "Si vous devez créer la base de données:"
echo "  mysql -u root -p"
echo "  CREATE DATABASE gestion_commerciale;"
echo "  CREATE USER 'ghostuser'@'localhost' IDENTIFIED BY 'password123!';"
echo "  GRANT ALL PRIVILEGES ON gestion_commerciale.* TO 'ghostuser'@'localhost';"
echo "  FLUSH PRIVILEGES;"
echo ""
echo "Pour redémarrer l'application après correction:"
echo "  pm2 restart gestion-commerciale"
echo "  pm2 logs gestion-commerciale --lines 50"
echo ""

