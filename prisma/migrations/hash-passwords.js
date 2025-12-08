// Script pour hasher les mots de passe non hashés
// ⚠️  ATTENTION: Ce script va hasher tous les mots de passe non hashés
// Usage: node prisma/migrations/hash-passwords.js

require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function hashPasswords() {
  try {
    console.log('🔐 Script de hashage des mots de passe\n');
    console.log('⚠️  ATTENTION: Ce script va hasher tous les mots de passe non hashés!');
    console.log('   Les utilisateurs devront utiliser leur mot de passe actuel après le hashage.\n');
    
    const answer = await question('Voulez-vous continuer? (oui/non): ');
    if (answer.toLowerCase() !== 'oui' && answer.toLowerCase() !== 'o') {
      console.log('❌ Opération annulée');
      rl.close();
      await prisma.$disconnect();
      return;
    }
    
    console.log('\n🔍 Recherche des mots de passe non hashés...\n');
    
    // Récupérer tous les utilisateurs
    const users = await prisma.$queryRaw`
      SELECT id, email, mot_de_passe, LENGTH(mot_de_passe) as pwd_length
      FROM utilisateur
    `;
    
    if (!users || users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé');
      rl.close();
      await prisma.$disconnect();
      return;
    }
    
    const unhashedUsers = [];
    
    for (const user of users) {
      const pwdLength = parseInt(user.pwd_length);
      const password = user.mot_de_passe;
      
      // Un mot de passe bcrypt hashé fait 60 caractères et commence par $2a$, $2b$ ou $2y$
      if (pwdLength !== 60 || !password.startsWith('$2')) {
        unhashedUsers.push({
          id: user.id,
          email: user.email,
          password: password
        });
      }
    }
    
    if (unhashedUsers.length === 0) {
      console.log('✅ Tous les mots de passe sont déjà hashés!');
      rl.close();
      await prisma.$disconnect();
      return;
    }
    
    console.log(`⚠️  ${unhashedUsers.length} utilisateur(s) avec mot de passe non hashé trouvé(s):\n`);
    unhashedUsers.forEach(u => {
      console.log(`   - ${u.email} (ID: ${u.id})`);
    });
    console.log('');
    
    const confirm = await question('Voulez-vous hasher ces mots de passe maintenant? (oui/non): ');
    if (confirm.toLowerCase() !== 'oui' && confirm.toLowerCase() !== 'o') {
      console.log('❌ Opération annulée');
      rl.close();
      await prisma.$disconnect();
      return;
    }
    
    console.log('\n🔄 Hashage en cours...\n');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of unhashedUsers) {
      try {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        await prisma.$executeRaw`
          UPDATE utilisateur
          SET mot_de_passe = ${hashedPassword}
          WHERE id = ${user.id}
        `;
        
        console.log(`✅ ${user.email} - Mot de passe hashé`);
        successCount++;
      } catch (error) {
        console.error(`❌ ${user.email} - Erreur: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log('\n📊 Résumé:');
    console.log(`   ✅ ${successCount} mot(s) de passe hashé(s) avec succès`);
    if (errorCount > 0) {
      console.log(`   ❌ ${errorCount} erreur(s)`);
    }
    console.log('\n✅ Opération terminée!');
    console.log('   Les utilisateurs peuvent maintenant se connecter avec leur mot de passe actuel.');
    
    rl.close();
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    rl.close();
    await prisma.$disconnect();
    process.exit(1);
  }
}

hashPasswords();

