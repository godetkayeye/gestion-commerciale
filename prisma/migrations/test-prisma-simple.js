// Test simple de Prisma Client
require('dotenv').config({ path: '.env' });

console.log('🔍 Test Prisma Client...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Présent' : '❌ Manquant');

// Vérifier que Prisma Client est généré
const path = require('path');
const fs = require('fs');
const prismaPath = path.resolve(__dirname, '../../app/generated/prisma');

if (fs.existsSync(prismaPath)) {
  console.log('✅ Prisma Client trouvé dans:', prismaPath);
} else {
  console.log('⚠️  Prisma Client non trouvé dans app/generated/prisma');
  console.log('   (Ce n\'est pas bloquant si @prisma/client fonctionne)');
}

// Utiliser le client Prisma standard (depuis node_modules ou généré)
try {
  // Essayer d'abord avec le client généré personnalisé si disponible
  let PrismaClient;
  try {
    // Le client généré dans app/generated/prisma peut être utilisé via @prisma/client
    // si la configuration Prisma pointe vers ce chemin
    PrismaClient = require('@prisma/client').PrismaClient;
    console.log('✅ Prisma Client chargé depuis @prisma/client');
  } catch (e) {
    throw new Error('Impossible de charger Prisma Client: ' + e.message);
  }
  
  const prisma = new PrismaClient();
  console.log('✅ Prisma Client instancié');
  
  // Tester la connexion
  prisma.$queryRaw`SELECT 1 as test`.then(r => {
    console.log('✅ Connexion Prisma OK:', r);
    return prisma.$disconnect();
  }).then(() => {
    console.log('✅ Test réussi !');
    process.exit(0);
  }).catch(e => {
    console.error('❌ Erreur Prisma:', e.message);
    if (e.message.includes('Unknown database') || e.message.includes('Access denied')) {
      console.error('💡 Vérifiez votre DATABASE_URL dans .env');
    }
    console.error('Stack:', e.stack);
    prisma.$disconnect().finally(() => process.exit(1));
  });
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
  console.error('💡 Assurez-vous que Prisma Client est généré: npx prisma generate');
  process.exit(1);
}

