# Guide de résolution du problème de connexion MySQL sur le VPS

## Problème
L'application ne peut pas se connecter à MySQL, ce qui empêche l'authentification de fonctionner.

## Étapes de diagnostic

### 1. Exécuter le script de diagnostic
Sur le VPS, exécutez :
```bash
cd ~/gestion-commerciale
bash check-mysql-vps.sh
```

### 2. Vérifier si MySQL est démarré
```bash
sudo systemctl status mysql
# ou
sudo systemctl status mysqld
```

Si MySQL n'est pas démarré :
```bash
sudo systemctl start mysql
# ou
sudo systemctl start mysqld
```

Pour démarrer MySQL au boot :
```bash
sudo systemctl enable mysql
# ou
sudo systemctl enable mysqld
```

### 3. Vérifier la connexion MySQL manuellement
```bash
mysql -u ghostuser -p'password123!' -h localhost gestion_commerciale
```

Si cela échoue, vérifiez :
- Que l'utilisateur `ghostuser` existe
- Que la base de données `gestion_commerciale` existe
- Que les permissions sont correctes

### 4. Créer l'utilisateur et la base de données (si nécessaire)
```bash
mysql -u root -p
```

Puis dans MySQL :
```sql
CREATE DATABASE IF NOT EXISTS gestion_commerciale;
CREATE USER IF NOT EXISTS 'ghostuser'@'localhost' IDENTIFIED BY 'password123!';
GRANT ALL PRIVILEGES ON gestion_commerciale.* TO 'ghostuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 5. Vérifier les variables d'environnement PM2
```bash
pm2 describe gestion-commerciale
```

Vérifiez que `DATABASE_URL` est bien défini. Si ce n'est pas le cas :
```bash
pm2 delete gestion-commerciale
pm2 start ecosystem.config.js
pm2 save
```

### 6. Vérifier les logs après redémarrage
```bash
pm2 restart gestion-commerciale
pm2 logs gestion-commerciale --lines 50
```

## Solutions alternatives

### Si MySQL écoute sur un autre port
Modifiez `ecosystem.config.js` :
```javascript
DATABASE_URL: "mysql://ghostuser:password123!@localhost:PORT/gestion_commerciale"
```

### Si MySQL écoute sur 127.0.0.1 au lieu de localhost
Essayez :
```javascript
DATABASE_URL: "mysql://ghostuser:password123!@127.0.0.1:3306/gestion_commerciale"
```

### Si vous utilisez un socket Unix
```javascript
DATABASE_URL: "mysql://ghostuser:password123!@localhost/gestion_commerciale?socket=/var/run/mysqld/mysqld.sock"
```

## Après correction

1. Redémarrez l'application :
```bash
pm2 restart gestion-commerciale
```

2. Vérifiez les logs :
```bash
pm2 logs gestion-commerciale --lines 30
```

3. Testez la connexion dans l'application web

