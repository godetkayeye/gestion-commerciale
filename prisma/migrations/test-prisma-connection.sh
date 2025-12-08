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
# Créer un fichier de test temporaire
cat > /tmp/test-prisma.js << 'TESTEOF'
// Utiliser le chemin absolu et gérer les imports TypeScript
const path = require('path');
const fs = require('fs');

// Vérifier si on peut charger Prisma via le build Next.js
const prismaPath = path.join(__dirname, '../app/generated/prisma');
const clientPath = path.join(prismaPath, 'client.ts');

if (!fs.existsSync(clientPath)) {
  console.error('❌ Prisma Client non trouvé à:', clientPath);
  process.exit(1);
}

// Essayer de charger via require avec résolution de chemin
try {
  // Pour les fichiers TypeScript, on doit utiliser une autre approche
  // Testons directement avec mysql2 pour vérifier la connexion
  const mysql = require('mysql2/promise');
  
  // Extraire les infos de connexion depuis DATABASE_URL
  const dotenv = require('dotenv');
  dotenv.config({ path: path.join(__dirname, '../.env') });
  
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL non trouvé');
    process.exit(1);
  }
  
  // Parser DATABASE_URL (format: mysql://user:pass@host:port/db)
  const match = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    console.error('❌ Format DATABASE_URL invalide');
    process.exit(1);
  }
  
  const [, user, password, host, port, database] = match;
  
  console.log('   Connexion à MySQL...');
  const connection = await mysql.createConnection({
    host,
    port: parseInt(port),
    user,
    password,
    database,
  });
  
  console.log('   ✅ Connexion MySQL OK');
  
  // Test 1: Requête simple
  const [rows1] = await connection.execute('SELECT 1 as test');
  console.log('   ✅ Test 1 OK:', rows1);
  
  // Test 2: Compter les utilisateurs
  const [rows2] = await connection.execute('SELECT COUNT(*) as count FROM utilisateur');
  console.log('   ✅ Test 2 - Utilisateurs:', rows2);
  
  // Test 3: Récupérer un utilisateur
  const [rows3] = await connection.execute('SELECT id, email, nom, role FROM utilisateur LIMIT 1');
  console.log('   ✅ Test 3 - Utilisateur:', rows3);
  
  await connection.end();
  console.log('');
  console.log('✅ Tous les tests de connexion sont passés !');
  
} catch (error) {
  console.error('');
  console.error('❌ Erreur:');
  console.error('   Message:', error.message);
  console.error('   Stack:', error.stack);
  process.exit(1);
}
TESTEOF

node /tmp/test-prisma.js
rm -f /tmp/test-prisma.js

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

