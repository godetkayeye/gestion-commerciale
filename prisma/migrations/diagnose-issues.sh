#!/bin/bash

# Script de diagnostic pour identifier les problèmes après déploiement
# Usage: ./diagnose-issues.sh

set -e

echo "🔍 Diagnostic des problèmes..."
echo ""

# 1. Vérifier PM2
echo "📊 1. Statut PM2:"
pm2 status
echo ""

# 2. Vérifier les logs d'erreur
echo "📋 2. Dernières erreurs PM2 (50 lignes):"
pm2 logs gestion-commerciale --err --lines 50 --nostream 2>/dev/null || echo "Aucune erreur récente"
echo ""

# 3. Vérifier si le logo existe
echo "🖼️  3. Vérification du logo:"
if [ -f "public/logos/vilakazi-logo.png" ]; then
    echo "✅ Logo trouvé: public/logos/vilakazi-logo.png"
    ls -lh public/logos/vilakazi-logo.png
else
    echo "❌ Logo NON trouvé: public/logos/vilakazi-logo.png"
    echo "   Vérifiez si le dossier existe:"
    ls -la public/logos/ 2>/dev/null || echo "   Le dossier public/logos/ n'existe pas"
fi
echo ""

# 4. Vérifier l'API des serveurs
echo "🌐 4. Test de l'API des serveurs:"
echo "   (Note: nécessite une session active)"
curl -s http://localhost:3000/api/restaurant/serveurs 2>/dev/null | head -c 200 || echo "   ❌ L'API ne répond pas ou nécessite une authentification"
echo ""
echo ""

# 5. Vérifier les fichiers du build
echo "📦 5. Vérification du build:"
if [ -d ".next" ]; then
    echo "✅ Dossier .next existe"
    echo "   Taille: $(du -sh .next | cut -f1)"
    echo "   Fichiers: $(find .next -type f | wc -l)"
    
    # Vérifier si le logo est dans le build
    if [ -f ".next/static/media/vilakazi-logo"* ] || [ -d ".next/static/images" ]; then
        echo "   ✅ Assets statiques trouvés"
    else
        echo "   ⚠️  Assets statiques non trouvés dans .next/static/"
    fi
else
    echo "❌ Dossier .next n'existe pas"
fi
echo ""

# 6. Vérifier les variables d'environnement
echo "🔐 6. Vérification des variables d'environnement:"
if [ -f ".env" ]; then
    echo "✅ Fichier .env existe"
    echo "   Variables présentes: $(grep -c '=' .env || echo 0) lignes"
else
    echo "❌ Fichier .env n'existe pas"
fi
echo ""

# 7. Vérifier la base de données
echo "💾 7. Test de connexion à la base de données:"
if command -v mysql &> /dev/null; then
    echo "   MySQL est installé"
else
    echo "   ⚠️  MySQL client non trouvé"
fi
echo ""

# 8. Vérifier les permissions
echo "🔒 8. Vérification des permissions:"
ls -la public/logos/ 2>/dev/null | head -5 || echo "   Dossier public/logos/ non accessible"
echo ""

echo "✅ Diagnostic terminé!"
echo ""
echo "💡 Commandes utiles:"
echo "   - pm2 logs gestion-commerciale --lines 100"
echo "   - pm2 restart gestion-commerciale"
echo "   - curl http://localhost:3000/api/restaurant/serveurs"

