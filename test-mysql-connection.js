// Script de test de connexion MySQL pour le VPS
// Usage: node test-mysql-connection.js

const mysql = require('mysql2/promise');

const config = {
  host: 'localhost',
  port: 3306,
  user: 'ghostuser',
  password: 'password123!',
  database: 'gestion_commerciale',
};

async function testConnection() {
  console.log('=== Test de connexion MySQL ===\n');
  console.log('Configuration:');
  console.log(`  Host: ${config.host}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  User: ${config.user}`);
  console.log(`  Database: ${config.database}\n`);

  try {
    const connection = await mysql.createConnection(config);
    console.log('✓ Connexion réussie !\n');

    // Test simple de requête
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✓ Test de requête réussi:', rows);

    // Vérifier si la table utilisateur existe
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'utilisateur'"
    );
    if (tables.length > 0) {
      console.log('✓ La table "utilisateur" existe');
      
      // Compter les utilisateurs
      const [users] = await connection.execute('SELECT COUNT(*) as count FROM utilisateur');
      console.log(`✓ Nombre d'utilisateurs: ${users[0].count}`);
    } else {
      console.log('⚠ La table "utilisateur" n\'existe pas');
    }

    await connection.end();
    console.log('\n✓ Connexion fermée avec succès');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Erreur de connexion:');
    console.error(`  Code: ${error.code}`);
    console.error(`  Message: ${error.message}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n→ MySQL n\'est probablement pas démarré ou n\'écoute pas sur le port 3306');
      console.error('  Essayez: sudo systemctl start mysql');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n→ Erreur d\'authentification');
      console.error('  Vérifiez les identifiants dans ecosystem.config.js');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n→ La base de données n\'existe pas');
      console.error('  Créez-la avec: CREATE DATABASE gestion_commerciale;');
    }
    
    process.exit(1);
  }
}

testConnection();

