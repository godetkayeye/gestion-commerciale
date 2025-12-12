#!/bin/bash

# Script de diagnostic pour les problèmes front-end sur le VPS
# Usage: bash diagnose-frontend-vps.sh

echo "=========================================="
echo "  DIAGNOSTIC FRONT-END VPS"
echo "=========================================="
echo ""

cd ~/gestion-commerciale || exit 1

echo "=== 1. Vérification de la structure des fichiers ==="
echo ""

echo "📁 Fichiers statiques Next.js :"
if [ -d ".next/static" ]; then
    STATIC_COUNT=$(find .next/static -type f | wc -l)
    echo "  ✓ .next/static existe ($STATIC_COUNT fichiers)"
    echo "  → Exemples de fichiers :"
    find .next/static -type f | head -5 | sed 's/^/    /'
else
    echo "  ✗ .next/static n'existe pas"
fi
echo ""

echo "📁 Fichiers statiques standalone :"
if [ -d ".next/standalone/gestion-commerciale/.next/static" ]; then
    STANDALONE_COUNT=$(find .next/standalone/gestion-commerciale/.next/static -type f | wc -l)
    echo "  ✓ .next/standalone/gestion-commerciale/.next/static existe ($STANDALONE_COUNT fichiers)"
    echo "  → Exemples de fichiers :"
    find .next/standalone/gestion-commerciale/.next/static -type f | head -5 | sed 's/^/    /'
else
    echo "  ✗ .next/standalone/gestion-commerciale/.next/static n'existe pas"
    echo "  → Les fichiers statiques ne sont pas copiés dans standalone"
fi
echo ""

echo "📁 Fichier server.js standalone :"
if [ -f ".next/standalone/server.js" ]; then
    echo "  ✓ .next/standalone/server.js existe"
    SIZE=$(du -h .next/standalone/server.js | cut -f1)
    echo "  → Taille : $SIZE"
else
    echo "  ✗ .next/standalone/server.js n'existe pas"
fi
echo ""

echo "=== 2. Vérification de PM2 ==="
echo ""

if pm2 describe gestion-commerciale &>/dev/null; then
    echo "  ✓ Application PM2 trouvée"
    echo ""
    echo "  📊 Statut :"
    pm2 describe gestion-commerciale | grep -E "status|pid|uptime|restarts" | sed 's/^/    /'
    echo ""
    echo "  📂 Répertoire de travail :"
    pm2 describe gestion-commerciale | grep "cwd" | sed 's/^/    /'
    echo ""
    echo "  🚀 Script exécuté :"
    pm2 describe gestion-commerciale | grep "script path" | sed 's/^/    /'
else
    echo "  ✗ Application PM2 non trouvée"
fi
echo ""

echo "=== 3. Vérification des imports CSS ==="
echo ""

echo "  📄 app/layout.tsx :"
if grep -q "sweetalert2/dist/sweetalert2.min.css" app/layout.tsx 2>/dev/null; then
    echo "    ✓ SweetAlert2 CSS importé"
else
    echo "    ✗ SweetAlert2 CSS non importé"
fi

if grep -q "globals.css" app/layout.tsx 2>/dev/null; then
    echo "    ✓ globals.css importé"
else
    echo "    ✗ globals.css non importé"
fi
echo ""

echo "=== 4. Test de connexion HTTP ==="
echo ""

echo "  🌐 Test localhost:4000 :"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000 || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "301" ]; then
    echo "    ✓ Serveur répond (code: $HTTP_CODE)"
else
    echo "    ✗ Serveur ne répond pas (code: $HTTP_CODE)"
fi
echo ""

echo "=== 5. Vérification des logs récents ==="
echo ""

if pm2 describe gestion-commerciale &>/dev/null; then
    echo "  📋 Dernières erreurs (10 lignes) :"
    pm2 logs gestion-commerciale --err --lines 10 --nostream 2>/dev/null | tail -10 | sed 's/^/    /' || echo "    (aucune erreur récente)"
    echo ""
    echo "  📋 Derniers logs (20 lignes) :"
    pm2 logs gestion-commerciale --lines 20 --nostream 2>/dev/null | tail -20 | sed 's/^/    /' || echo "    (aucun log)"
else
    echo "  ⚠ Impossible de récupérer les logs (PM2 non trouvé)"
fi
echo ""

echo "=== 6. Vérification de la configuration Next.js ==="
echo ""

if [ -f "next.config.ts" ]; then
    echo "  📄 next.config.ts :"
    if grep -q "output.*standalone" next.config.ts; then
        echo "    ✓ Mode standalone activé"
    else
        echo "    ✗ Mode standalone non activé"
    fi
else
    echo "  ✗ next.config.ts non trouvé"
fi
echo ""

echo "=== 7. Vérification des permissions ==="
echo ""

if [ -d ".next/standalone" ]; then
    echo "  🔐 Permissions du dossier standalone :"
    ls -ld .next/standalone | sed 's/^/    /'
    echo ""
    echo "  🔐 Permissions des fichiers statiques :"
    if [ -d ".next/standalone/gestion-commerciale/.next/static" ]; then
        ls -ld .next/standalone/gestion-commerciale/.next/static | sed 's/^/    /'
    fi
fi
echo ""

echo "=== 8. Recommandations ==="
echo ""

ISSUES=0

if [ ! -d ".next/standalone/gestion-commerciale/.next/static" ]; then
    echo "  ⚠ PROBLÈME : Fichiers statiques manquants dans standalone"
    echo "     → Solution : Exécutez 'npm run build' puis vérifiez le postbuild"
    ISSUES=$((ISSUES + 1))
fi

if ! pm2 describe gestion-commerciale &>/dev/null; then
    echo "  ⚠ PROBLÈME : Application PM2 non démarrée"
    echo "     → Solution : Exécutez 'pm2 start ecosystem.config.js'"
    ISSUES=$((ISSUES + 1))
fi

if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "302" ] && [ "$HTTP_CODE" != "301" ]; then
    echo "  ⚠ PROBLÈME : Serveur ne répond pas"
    echo "     → Solution : Vérifiez les logs PM2 avec 'pm2 logs gestion-commerciale'"
    ISSUES=$((ISSUES + 1))
fi

if ! grep -q "sweetalert2/dist/sweetalert2.min.css" app/layout.tsx 2>/dev/null; then
    echo "  ⚠ PROBLÈME : SweetAlert2 CSS non importé"
    echo "     → Solution : Ajoutez 'import \"sweetalert2/dist/sweetalert2.min.css\";' dans app/layout.tsx"
    ISSUES=$((ISSUES + 1))
fi

if [ $ISSUES -eq 0 ]; then
    echo "  ✓ Aucun problème détecté"
    echo ""
    echo "  💡 Si les modals ne s'ouvrent toujours pas :"
    echo "     → Vérifiez la console du navigateur (F12)"
    echo "     → Vérifiez l'onglet Network pour les erreurs 404"
    echo "     → Vérifiez que les fichiers CSS/JS sont bien chargés"
fi

echo ""
echo "=========================================="
echo "  DIAGNOSTIC TERMINÉ"
echo "=========================================="
echo ""

