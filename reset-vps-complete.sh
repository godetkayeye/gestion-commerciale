#!/bin/bash

# Script complet pour repartir de zéro sur le VPS
# Usage: bash reset-vps-complete.sh

set -e

echo "=========================================="
echo "  REPARTIR DE ZÉRO SUR LE VPS"
echo "=========================================="
echo ""
echo "⚠️  ATTENTION : Ce script va supprimer tous les fichiers générés"
echo "   et réinstaller l'application depuis zéro."
echo ""
read -p "Continuer ? (oui/non) " -r
echo ""

if [[ ! $REPLY =~ ^[Oo][Uu][Ii]$ ]]; then
    echo "Annulé."
    exit 1
fi

cd ~/gestion-commerciale || exit 1

echo "=== Étape 1/10 : Arrêt de l'application PM2 ==="
if pm2 describe gestion-commerciale &>/dev/null; then
    pm2 stop gestion-commerciale
    pm2 delete gestion-commerciale
    echo "✓ Application arrêtée et supprimée"
else
    echo "⚠ Application non trouvée dans PM2"
fi
echo ""

echo "=== Étape 2/10 : Nettoyage complet ==="
echo "Suppression de node_modules, .next, app/generated..."
rm -rf node_modules
rm -rf package-lock.json
rm -rf .next
rm -rf app/generated
rm -rf .npm
rm -rf .cache
npm cache clean --force
echo "✓ Nettoyage terminé"
echo ""

echo "=== Étape 3/10 : Récupération depuis GitHub ==="
echo "Récupération de la dernière version..."
git fetch origin
git reset --hard origin/main
git clean -fd
echo "✓ Code source mis à jour"
echo ""

echo "=== Étape 4/10 : Vérification de MySQL ==="
if systemctl is-active --quiet mysql || systemctl is-active --quiet mysqld || systemctl is-active --quiet mariadb; then
    echo "✓ MySQL est en cours d'exécution"
else
    echo "⚠ MySQL n'est pas démarré, tentative de démarrage..."
    sudo systemctl start mysql || sudo systemctl start mysqld || sudo systemctl start mariadb
    sudo systemctl enable mysql || sudo systemctl enable mysqld || sudo systemctl enable mariadb
    echo "✓ MySQL démarré"
fi
echo ""

echo "=== Étape 5/10 : Installation des dépendances ==="
echo "Cela peut prendre 15-20 minutes..."
npm install
echo "✓ Dépendances installées"
echo ""

echo "=== Étape 6/10 : Vérification du fichier .env ==="
if [ ! -f .env ]; then
    echo "⚠ Fichier .env non trouvé !"
    echo "Création d'un fichier .env exemple..."
    cat > .env << EOF
DATABASE_URL="mysql://ghostuser:password123!@localhost:3306/gestion_commerciale"
NEXTAUTH_SECRET="FrziolYfWSVRH501kkojbHszR/Cts7KA3wMzIMZklyY="
NEXTAUTH_URL="http://72.61.109.17:4000"
EOF
    echo "⚠ Veuillez vérifier et modifier le fichier .env si nécessaire"
else
    echo "✓ Fichier .env trouvé"
fi
echo ""

echo "=== Étape 7/10 : Génération de Prisma Client ==="
npx prisma generate
echo "✓ Prisma Client généré"
echo ""

echo "=== Étape 8/10 : Build de l'application ==="
echo "Cela peut prendre 3-5 minutes..."
npm run build
echo "✓ Build terminé"
echo ""

echo "=== Étape 9/10 : Vérification des fichiers statiques ==="
if [ -d ".next/standalone/gestion-commerciale/.next/static" ]; then
    echo "✓ Fichiers statiques trouvés"
    STATIC_COUNT=$(find .next/standalone/gestion-commerciale/.next/static -type f | wc -l)
    echo "  → $STATIC_COUNT fichiers statiques"
else
    echo "⚠ Fichiers statiques non trouvés, copie manuelle..."
    mkdir -p .next/standalone/gestion-commerciale/.next
    cp -r .next/static .next/standalone/gestion-commerciale/.next/static 2>/dev/null || true
    if [ -d ".next/standalone/gestion-commerciale/.next/static" ]; then
        echo "✓ Fichiers statiques copiés"
    else
        echo "✗ Erreur lors de la copie des fichiers statiques"
    fi
fi
echo ""

echo "=== Étape 10/10 : Démarrage de l'application ==="
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js
    pm2 save
    echo "✓ Application démarrée avec PM2"
else
    echo "✗ Fichier ecosystem.config.js non trouvé !"
    echo "  Démarrage manuel requis"
fi
echo ""

echo "=== Attente du démarrage (10 secondes) ==="
sleep 10
echo ""

echo "=== Statut de l'application ==="
pm2 status
echo ""

echo "=== Derniers logs (30 lignes) ==="
pm2 logs gestion-commerciale --lines 30 --nostream
echo ""

echo "=========================================="
echo "  INSTALLATION TERMINÉE"
echo "=========================================="
echo ""
echo "Pour suivre les logs en temps réel :"
echo "  pm2 logs gestion-commerciale"
echo ""
echo "Pour redémarrer l'application :"
echo "  pm2 restart gestion-commerciale"
echo ""
echo "Pour vérifier le statut :"
echo "  pm2 status"
echo ""
echo "Testez l'application dans votre navigateur :"
echo "  http://72.61.109.17:4000"
echo ""

