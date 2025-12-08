// Script pour vérifier et hasher les mots de passe non hashés
// Usage: node prisma/migrations/check-hash-passwords.js

require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function checkAndHashPasswords() {
  try {
    console.log('🔍 Vérification des mots de passe dans la base de données...\n');
    
    // Récupérer tous les utilisateurs
    const users = await prisma.$queryRaw`
      SELECT id, email, mot_de_passe, LENGTH(mot_de_passe) as pwd_length
      FROM utilisateur
      LIMIT 100
    `;
    
    if (!users || users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé');
      await prisma.$disconnect();
      return;
    }
    
    console.log(`📊 ${users.length} utilisateur(s) trouvé(s)\n`);
    
    const unhashedUsers = [];
    const hashedUsers = [];
    
    for (const user of users) {
      const pwdLength = parseInt(user.pwd_length);
      const password = user.mot_de_passe;
      
      // Un mot de passe bcrypt hashé fait 60 caractères
      // Un mot de passe non hashé fait généralement moins de 60 caractères
      if (pwdLength !== 60) {
        unhashedUsers.push({
          id: user.id,
          email: user.email,
          password: password,
          length: pwdLength
        });
      } else {
        // Vérifier que c'est bien un hash bcrypt valide
        try {
          // Tester si c'est un hash bcrypt valide (commence par $2a$, $2b$ ou $2y$)
          if (password.startsWith('$2a$') || password.startsWith('$2b$') || password.startsWith('$2y$')) {
            hashedUsers.push({
              id: user.id,
              email: user.email,
              status: 'hashé (bcrypt)'
            });
          } else {
            unhashedUsers.push({
              id: user.id,
              email: user.email,
              password: password,
              length: pwdLength,
              note: 'Longueur 60 mais format invalide'
            });
          }
        } catch (e) {
          unhashedUsers.push({
            id: user.id,
            email: user.email,
            password: password,
            length: pwdLength,
            note: 'Format suspect'
          });
        }
      }
    }
    
    console.log('✅ Utilisateurs avec mots de passe hashés:');
    if (hashedUsers.length > 0) {
      hashedUsers.forEach(u => {
        console.log(`   - ${u.email} (ID: ${u.id})`);
      });
    } else {
      console.log('   Aucun');
    }
    console.log('');
    
    console.log('⚠️  Utilisateurs avec mots de passe NON hashés:');
    if (unhashedUsers.length > 0) {
      unhashedUsers.forEach(u => {
        console.log(`   - ${u.email} (ID: ${u.id}, longueur: ${u.length})${u.note ? ' - ' + u.note : ''}`);
      });
      console.log('');
      console.log('❌ PROBLÈME: Des mots de passe ne sont pas hashés!');
      console.log('   En production, tous les mots de passe doivent être hashés avec bcrypt.');
      console.log('');
      console.log('💡 Pour hasher les mots de passe, utilisez:');
      console.log('   node prisma/migrations/hash-passwords.js');
      console.log('');
      console.log('   OU manuellement pour chaque utilisateur:');
      console.log('   const bcrypt = require("bcrypt");');
      console.log('   const hashed = await bcrypt.hash("motdepasse", 10);');
      console.log('   // Puis mettre à jour dans la base de données');
    } else {
      console.log('   Aucun - Tous les mots de passe sont hashés ✅');
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkAndHashPasswords();

