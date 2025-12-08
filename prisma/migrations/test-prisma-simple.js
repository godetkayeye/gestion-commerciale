// Test simple de Prisma Client
require('dotenv').config({ path: '.env' });

console.log('🔍 Test Prisma Client...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Présent' : '❌ Manquant');

// Essayer de charger Prisma Client
try {
  // Méthode 1: Depuis le build Next.js
  const path = require('path');
  // __dirname est dans prisma/migrations/, donc on remonte de 2 niveaux pour aller à la racine
  const prismaPath = path.resolve(__dirname, '../../app/generated/prisma');
  console.log('Chemin Prisma:', prismaPath);
  
  // Vérifier si le dossier existe
  const fs = require('fs');
  if (!fs.existsSync(prismaPath)) {
    console.error('❌ Dossier Prisma Client non trouvé à:', prismaPath);
    process.exit(1);
  }
  
  // Vérifier si le fichier client existe (peut être .ts ou .js)
  const clientTs = path.join(prismaPath, 'client.ts');
  const clientJs = path.join(prismaPath, 'client.js');
  const clientIndex = path.join(prismaPath, 'index.js');
  
  if (!fs.existsSync(clientTs) && !fs.existsSync(clientJs) && !fs.existsSync(clientIndex)) {
    console.error('❌ Prisma Client non trouvé dans:', prismaPath);
    console.error('   Fichiers trouvés:', fs.readdirSync(prismaPath).slice(0, 5).join(', '));
    process.exit(1);
  }
  
  console.log('✅ Prisma Client trouvé');
  
  // Essayer de charger depuis le chemin généré (utilise le client compilé si disponible)
  try {
    // Essayer d'abord avec le chemin direct
    let PrismaClient;
    try {
      // Si on est dans un environnement Next.js, le client peut être compilé
      PrismaClient = require(prismaPath).PrismaClient;
    } catch (e) {
      // Sinon, essayer depuis node_modules (fallback)
      PrismaClient = require('@prisma/client').PrismaClient;
      console.log('⚠️  Utilisation du Prisma Client depuis node_modules');
    }
    
    if (!PrismaClient) {
      throw new Error('PrismaClient non trouvé');
    }
    
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
    // Essayer avec le client depuis node_modules en dernier recours
    try {
      console.log('🔄 Tentative avec Prisma Client depuis node_modules...');
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      return prisma.$queryRaw`SELECT 1 as test`.then(r => {
        console.log('✅ Connexion Prisma OK (via node_modules):', r);
        return prisma.$disconnect();
      }).then(() => {
        console.log('✅ Test réussi !');
        process.exit(0);
      });
    } catch (e2) {
      console.error('❌ Échec complet:', e2.message);
      process.exit(1);
    }
  }
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
}

