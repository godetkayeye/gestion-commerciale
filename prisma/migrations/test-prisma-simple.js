// Test simple de Prisma Client
require('dotenv').config({ path: '.env' });

console.log('🔍 Test Prisma Client...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Présent' : '❌ Manquant');

// Essayer de charger Prisma Client
try {
  // Méthode 1: Depuis le build Next.js
  const path = require('path');
  const prismaPath = path.resolve(__dirname, '../app/generated/prisma');
  console.log('Chemin Prisma:', prismaPath);
  
  // Vérifier si le fichier existe
  const fs = require('fs');
  if (!fs.existsSync(path.join(prismaPath, 'client.ts'))) {
    console.error('❌ Prisma Client non trouvé à:', path.join(prismaPath, 'client.ts'));
    process.exit(1);
  }
  
  console.log('✅ Prisma Client trouvé');
  
  // Essayer de charger avec require (peut ne pas fonctionner pour .ts)
  try {
    const { PrismaClient } = require(prismaPath + '/client');
    console.log('✅ Prisma Client chargé');
    
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
      console.error('Stack:', e.stack);
      prisma.$disconnect().finally(() => process.exit(1));
    });
    
  } catch (e) {
    console.error('❌ Erreur lors du chargement:', e.message);
    console.error('Stack:', e.stack);
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}

