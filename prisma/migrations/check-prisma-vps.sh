#!/bin/bash

# Script pour vérifier si Prisma Client est présent sur le VPS
# Usage: ./prisma/migrations/check-prisma-vps.sh

set -e

echo "🔍 Vérification de Prisma Client sur le VPS..."
echo ""

# 1. Vérifier dans app/generated/prisma (source)
echo "1️⃣  Vérification dans app/generated/prisma (source):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "app/generated/prisma" ]; then
    echo "✅ Dossier app/generated/prisma existe"
    
    if [ -f "app/generated/prisma/client.ts" ]; then
        echo "✅ Fichier client.ts trouvé"
        SIZE=$(du -sh app/generated/prisma/client.ts | cut -f1)
        echo "   Taille: $SIZE"
    else
        echo "❌ Fichier client.ts MANQUANT"
    fi
    
    if [ -f "app/generated/prisma/index.js" ]; then
        echo "✅ Fichier index.js trouvé"
    fi
    
    # Compter les fichiers
    FILE_COUNT=$(find app/generated/prisma -type f | wc -l)
    echo "   Total fichiers: $FILE_COUNT"
    
    # Lister les principaux fichiers
    echo ""
    echo "   Principaux fichiers:"
    ls -lh app/generated/prisma/ | head -10 | tail -9 | awk '{print "   - " $9 " (" $5 ")"}'
    
else
    echo "❌ Dossier app/generated/prisma MANQUANT"
    echo "   Solution: ./prisma/migrations/generate-prisma-vps.sh"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 2. Vérifier dans .next/server/app/generated/prisma (build)
echo "2️⃣  Vérification dans .next/server/app/generated/prisma (build):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d ".next/server/app/generated/prisma" ]; then
    echo "✅ Dossier .next/server/app/generated/prisma existe"
    
    if [ -f ".next/server/app/generated/prisma/client.ts" ]; then
        echo "✅ Fichier client.ts trouvé dans le build"
        SIZE=$(du -sh .next/server/app/generated/prisma/client.ts | cut -f1)
        echo "   Taille: $SIZE"
    else
        echo "⚠️  Fichier client.ts manquant dans le build"
    fi
    
    if [ -f ".next/server/app/generated/prisma/index.js" ]; then
        echo "✅ Fichier index.js trouvé dans le build"
    fi
    
    # Compter les fichiers
    FILE_COUNT=$(find .next/server/app/generated/prisma -type f 2>/dev/null | wc -l)
    echo "   Total fichiers: $FILE_COUNT"
    
    if [ "$FILE_COUNT" -eq 0 ]; then
        echo "   ⚠️  Dossier vide!"
    else
        echo ""
        echo "   Principaux fichiers:"
        ls -lh .next/server/app/generated/prisma/ 2>/dev/null | head -10 | tail -9 | awk '{print "   - " $9 " (" $5 ")"}'
    fi
    
else
    echo "❌ Dossier .next/server/app/generated/prisma MANQUANT"
    echo "   Solution: Copier depuis app/generated/prisma"
    echo "   mkdir -p .next/server/app/generated"
    echo "   cp -r app/generated/prisma .next/server/app/generated/"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 3. Comparer les deux
echo "3️⃣  Comparaison source vs build:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "app/generated/prisma" ] && [ -d ".next/server/app/generated/prisma" ]; then
    SOURCE_COUNT=$(find app/generated/prisma -type f | wc -l)
    BUILD_COUNT=$(find .next/server/app/generated/prisma -type f 2>/dev/null | wc -l)
    
    if [ "$SOURCE_COUNT" -eq "$BUILD_COUNT" ]; then
        echo "✅ Nombre de fichiers identique: $SOURCE_COUNT"
    else
        echo "⚠️  Nombre de fichiers différent:"
        echo "   Source: $SOURCE_COUNT fichiers"
        echo "   Build: $BUILD_COUNT fichiers"
    fi
    
    # Vérifier si client.ts existe dans les deux
    if [ -f "app/generated/prisma/client.ts" ] && [ -f ".next/server/app/generated/prisma/client.ts" ]; then
        SOURCE_SIZE=$(stat -f%z app/generated/prisma/client.ts 2>/dev/null || stat -c%s app/generated/prisma/client.ts 2>/dev/null)
        BUILD_SIZE=$(stat -f%z .next/server/app/generated/prisma/client.ts 2>/dev/null || stat -c%s .next/server/app/generated/prisma/client.ts 2>/dev/null)
        
        if [ "$SOURCE_SIZE" -eq "$BUILD_SIZE" ]; then
            echo "✅ Taille de client.ts identique: $(numfmt --to=iec-i --suffix=B $SOURCE_SIZE 2>/dev/null || echo "$SOURCE_SIZE bytes")"
        else
            echo "⚠️  Taille de client.ts différente:"
            echo "   Source: $(numfmt --to=iec-i --suffix=B $SOURCE_SIZE 2>/dev/null || echo "$SOURCE_SIZE bytes")"
            echo "   Build: $(numfmt --to=iec-i --suffix=B $BUILD_SIZE 2>/dev/null || echo "$BUILD_SIZE bytes")"
        fi
    fi
else
    echo "⚠️  Impossible de comparer (un des dossiers manque)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 4. Test de chargement
echo "4️⃣  Test de chargement Prisma Client:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "prisma/migrations/test-prisma-simple.js" ]; then
    echo "🧪 Exécution du test..."
    if node prisma/migrations/test-prisma-simple.js 2>&1 | grep -q "Test réussi"; then
        echo "✅ Prisma Client fonctionne correctement"
    else
        echo "❌ Prisma Client ne fonctionne pas"
        echo "   Voir les détails ci-dessus"
    fi
else
    echo "⚠️  Script de test non trouvé"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 5. Résumé
echo "📋 Résumé:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

STATUS="✅"
if [ ! -d "app/generated/prisma" ]; then
    STATUS="❌"
    echo "❌ Prisma Client source MANQUANT"
elif [ ! -d ".next/server/app/generated/prisma" ]; then
    STATUS="⚠️"
    echo "⚠️  Prisma Client dans le build MANQUANT"
    echo "   Solution: Copier depuis app/generated/prisma"
elif [ ! -f ".next/server/app/generated/prisma/client.ts" ] && [ ! -f ".next/server/app/generated/prisma/index.js" ]; then
    STATUS="⚠️"
    echo "⚠️  Prisma Client dans le build incomplet"
    echo "   Solution: Copier depuis app/generated/prisma"
else
    echo "✅ Prisma Client présent et configuré"
fi

echo ""
echo "💡 Commandes utiles:"
echo "   - Générer Prisma Client: ./prisma/migrations/generate-prisma-vps.sh"
echo "   - Copier dans le build: mkdir -p .next/server/app/generated && cp -r app/generated/prisma .next/server/app/generated/"
echo "   - Corriger automatiquement: ./prisma/migrations/fix-auth.sh"

