// Script pour tester l'authentification directement
// Usage: node prisma/migrations/test-auth.js <email> <password>

require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function testAuth() {
  try {
    const email = process.argv[2];
    const password = process.argv[3];
    
    if (!email || !password) {
      console.log('Usage: node prisma/migrations/test-auth.js <email> <password>');
      process.exit(1);
    }
    
    console.log('🔐 Test d\'authentification...\n');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password.substring(0, 3)}***\n`);
    
    // Simuler la logique d'authentification de lib/auth.ts
    console.log('1️⃣  Recherche de l\'utilisateur...');
    const users = await prisma.$queryRaw`
      SELECT id, nom, email, mot_de_passe, role
      FROM utilisateur
      WHERE email = ${email}
      LIMIT 1
    `;
    
    if (!users || users.length === 0) {
      console.log('❌ Utilisateur non trouvé');
      await prisma.$disconnect();
      process.exit(1);
    }
    
    const user = users[0];
    console.log(`✅ Utilisateur trouvé: ${user.nom} (ID: ${user.id}, Role: ${user.role})`);
    console.log(`   Mot de passe en base: ${user.mot_de_passe.substring(0, 20)}... (longueur: ${user.mot_de_passe.length})`);
    console.log('');
    
    console.log('2️⃣  Vérification du mot de passe...');
    let valid = false;
    
    // Vérifier si c'est un hash bcrypt
    const isBcryptHash = user.mot_de_passe.startsWith('$2a$') || 
                         user.mot_de_passe.startsWith('$2b$') || 
                         user.mot_de_passe.startsWith('$2y$');
    
    if (isBcryptHash) {
      console.log('   Format: Hash bcrypt détecté');
      try {
        valid = await bcrypt.compare(password, user.mot_de_passe);
        if (valid) {
          console.log('✅ Mot de passe valide (bcrypt)');
        } else {
          console.log('❌ Mot de passe invalide (bcrypt)');
        }
      } catch (error) {
        console.log(`❌ Erreur lors de la comparaison bcrypt: ${error.message}`);
      }
    } else {
      console.log('   Format: Mot de passe non hashé');
      console.log(`   Longueur: ${user.mot_de_passe.length} caractères`);
      
      // En production, les mots de passe non hashés ne sont pas acceptés
      if (process.env.NODE_ENV === 'production') {
        console.log('❌ En production, les mots de passe doivent être hashés!');
        console.log('   Le mot de passe ne sera pas accepté en production.');
        valid = false;
      } else {
        // Tolérance DEV
        if (password === user.mot_de_passe) {
          console.log('✅ Mot de passe valide (tolérance DEV - non hashé)');
          valid = true;
        } else {
          console.log('❌ Mot de passe invalide');
        }
      }
    }
    console.log('');
    
    if (valid) {
      console.log('✅ AUTHENTIFICATION RÉUSSIE');
      console.log(`   Utilisateur: ${user.nom}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
    } else {
      console.log('❌ AUTHENTIFICATION ÉCHOUÉE');
      console.log('');
      console.log('💡 Causes possibles:');
      if (!isBcryptHash && process.env.NODE_ENV === 'production') {
        console.log('   - Le mot de passe n\'est pas hashé (requis en production)');
        console.log('   - Solution: Hasher le mot de passe avec bcrypt');
      } else if (!isBcryptHash) {
        console.log('   - Le mot de passe ne correspond pas');
      } else {
        console.log('   - Le mot de passe fourni est incorrect');
      }
    }
    
    await prisma.$disconnect();
    process.exit(valid ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testAuth();

