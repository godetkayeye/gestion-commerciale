#!/bin/bash

# Script pour résoudre les conflits Git sur le VPS
# Usage: ./resolve-git-conflict-vps.sh

set -e

echo "🔧 Résolution des conflits Git sur le VPS..."
echo ""

# 1. Écraser les modifications locales avec la version distante
echo "1️⃣  Écrasement des modifications locales..."
git checkout -- .next.tar.gz 2>/dev/null || true
git checkout -- setup-pm2.sh 2>/dev/null || true

# Supprimer les fichiers qui ne devraient plus être dans le repo
if [ -f ".next.tar.gz" ]; then
    rm -f .next.tar.gz
    echo "   .next.tar.gz supprimé (ne doit pas être dans Git)"
fi

if [ -f "setup-pm2.sh" ]; then
    rm -f setup-pm2.sh
    echo "   setup-pm2.sh supprimé (fichier obsolète)"
fi

echo "✅ Modifications locales écrasées"
echo ""

# 2. Pull depuis origin
echo "2️⃣  Récupération des dernières modifications..."
git pull origin main
echo "✅ Pull réussi"
echo ""

# 3. Vérifier que les scripts sont présents
echo "3️⃣  Vérification des scripts..."
if [ -f "fix-build-lock.sh" ]; then
    chmod +x fix-build-lock.sh
    echo "✅ fix-build-lock.sh trouvé et rendu exécutable"
else
    echo "⚠️  fix-build-lock.sh non trouvé"
fi

if [ -f "build-and-deploy.sh" ]; then
    chmod +x build-and-deploy.sh
    echo "✅ build-and-deploy.sh trouvé et rendu exécutable"
fi

echo ""
echo "🎉 Conflits résolus!"
echo ""
echo "💡 Vous pouvez maintenant:"
echo "   - Exécuter ./fix-build-lock.sh si nécessaire"
echo "   - Builder localement et copier sur le VPS"

