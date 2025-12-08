#!/bin/bash

# Script pour tester la connexion Prisma
# Usage: ./test-prisma-connection.sh

set -e

echo "🔍 Test de la connexion Prisma..."
echo ""

cd /var/www/ghostapp/gestion-commerciale

# 1. Vérifier DATABASE_URL
echo "📋 1. Vérification de DATABASE_URL:"
if grep -q "DATABASE_URL" .env; then
    echo "✅ DATABASE_URL trouvé dans .env"
    grep "DATABASE_URL" .env | sed 's/:[^@]*@/:***@/' | head -1
else
    echo "❌ DATABASE_URL non trouvé dans .env"
    exit 1
fi
echo ""

# 2. Vérifier Prisma Client
echo "📦 2. Vérification de Prisma Client:"
if [ -f "app/generated/prisma/client.ts" ]; then
    echo "✅ Prisma Client trouvé"
else
    echo "❌ Prisma Client non trouvé"
    exit 1
fi
echo ""

# 3. Vérifier le moteur de requête
echo "⚙️  3. Vérification du moteur de requête:"
if [ -f "app/generated/prisma/libquery_engine-debian-openssl-3.0.x.so.node" ]; then
    echo "✅ Moteur de requête trouvé"
    ls -lh app/generated/prisma/libquery_engine-debian-openssl-3.0.x.so.node
else
    echo "❌ Moteur de requête non trouvé"
    exit 1
fi
echo ""

# 4. Tester la connexion
echo "🔌 4. Test de connexion à la base de données:"
node << 'EOF'
const { PrismaClient } = require('./app/generated/prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function test() {
  try {
    // Test 1: Connexion simple
    console.log('   Test 1: Connexion simple...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('   ✅ Connexion OK:', result);
    
    // Test 2: Compter les utilisateurs
    console.log('   Test 2: Compter les utilisateurs...');
    const users = await prisma.$queryRaw`SELECT COUNT(*) as count FROM utilisateur`;
    console.log('   ✅ Utilisateurs:', users);
    
    // Test 3: Récupérer un utilisateur
    console.log('   Test 3: Récupérer un utilisateur...');
    const user = await prisma.$queryRaw`
      SELECT id, email, nom, role 
      FROM utilisateur 
      LIMIT 1
    `;
    console.log('   ✅ Utilisateur trouvé:', user);
    
    console.log('');
    console.log('✅ Tous les tests Prisma sont passés !');
    
  } catch (error) {
    console.error('');
    console.error('❌ Erreur Prisma:');
    console.error('   Message:', error.message);
    console.error('   Code:', error.code);
    if (error.meta) {
      console.error('   Meta:', JSON.stringify(error.meta, null, 2));
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

test();
EOF

echo ""
echo "✅ Test terminé !"

