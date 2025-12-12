# Guide complet : Repartir de zéro sur le VPS

Ce guide vous permettra de réinstaller complètement l'application sur le VPS et de résoudre les problèmes front-end.

## ⚠️ IMPORTANT : Sauvegardez d'abord vos données

Si vous avez des données importantes dans la base de données, faites une sauvegarde avant de continuer :

```bash
mysqldump -u ghostuser -p gestion_commerciale > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Étape 1 : Nettoyage complet

Sur le VPS, exécutez ces commandes pour tout nettoyer :

```bash
cd ~/gestion-commerciale

# Arrêter l'application PM2
pm2 stop gestion-commerciale
pm2 delete gestion-commerciale

# Supprimer tous les fichiers générés et caches
rm -rf node_modules
rm -rf package-lock.json
rm -rf .next
rm -rf app/generated
rm -rf .npm
rm -rf .cache

# Nettoyer le cache npm
npm cache clean --force
```

## Étape 2 : Récupérer la dernière version depuis GitHub

```bash
# S'assurer d'être sur la branche main
git checkout main

# Récupérer les dernières modifications
git fetch origin

# Réinitialiser complètement (ATTENTION : cela supprime toutes les modifications locales)
git reset --hard origin/main

# Nettoyer les fichiers non suivis
git clean -fd
```

## Étape 3 : Vérifier MySQL

```bash
# Vérifier que MySQL est démarré
sudo systemctl status mysql

# Si MySQL n'est pas démarré, le démarrer
sudo systemctl start mysql
sudo systemctl enable mysql

# Tester la connexion
mysql -u ghostuser -p -e "SELECT 1;" gestion_commerciale
```

## Étape 4 : Installation des dépendances

```bash
# Installer toutes les dépendances
npm install

# Cela peut prendre 15-20 minutes
```

## Étape 5 : Configuration de l'environnement

Vérifiez que votre fichier `.env` existe et contient les bonnes valeurs :

```bash
cat .env
```

Il doit contenir au minimum :
```
DATABASE_URL="mysql://ghostuser:password123!@localhost:3306/gestion_commerciale"
NEXTAUTH_SECRET="FrziolYfWSVRH501kkojbHszR/Cts7KA3wMzIMZklyY="
NEXTAUTH_URL="http://72.61.109.17:4000"
```

## Étape 6 : Génération de Prisma Client

```bash
# Générer le client Prisma
npx prisma generate
```

## Étape 7 : Build de l'application

```bash
# Build avec Next.js
npm run build

# Vérifier que les fichiers statiques sont copiés
ls -la .next/standalone/gestion-commerciale/.next/static/

# Si le dossier n'existe pas ou est vide, exécuter manuellement :
mkdir -p .next/standalone/gestion-commerciale/.next
cp -r .next/static .next/standalone/gestion-commerciale/.next/static
```

## Étape 8 : Vérifier la configuration PM2

Vérifiez que `ecosystem.config.js` est correct :

```bash
cat ecosystem.config.js
```

Il doit pointer vers `.next/standalone/server.js` et avoir le bon `cwd`.

## Étape 9 : Démarrer l'application avec PM2

```bash
# Démarrer l'application
pm2 start ecosystem.config.js

# Sauvegarder la configuration PM2
pm2 save

# Configurer PM2 pour démarrer au boot
pm2 startup
# (suivez les instructions affichées)

# Vérifier le statut
pm2 status

# Voir les logs
pm2 logs gestion-commerciale --lines 50
```

## Étape 10 : Vérification

1. **Vérifier que l'application répond** :
   ```bash
   curl http://localhost:4000
   ```

2. **Vérifier les logs PM2** pour des erreurs :
   ```bash
   pm2 logs gestion-commerciale --lines 100
   ```

3. **Tester dans le navigateur** :
   - Ouvrez `http://72.61.109.17:4000`
   - Vérifiez que les styles CSS sont chargés (pas de page blanche)
   - Testez l'ouverture d'un modal

## Diagnostic des problèmes front-end

Avant de repartir de zéro, exécutez le script de diagnostic :

```bash
bash diagnose-frontend-vps.sh
```

Ce script vérifiera :
- La présence des fichiers statiques
- La configuration PM2
- Les imports CSS
- La réponse du serveur
- Les erreurs dans les logs

## Problèmes courants et solutions

### Problème 1 : Les fichiers statiques ne se chargent pas

**Symptômes** : Page blanche, styles CSS absents, erreurs 404 pour les fichiers JS/CSS

**Diagnostic** :
```bash
ls -la .next/standalone/gestion-commerciale/.next/static/
```

**Solution** : Si le dossier est vide ou n'existe pas :
```bash
# Rebuild complet
rm -rf .next
npm run build

# Vérification
ls -la .next/standalone/gestion-commerciale/.next/static/

# Si toujours vide, copie manuelle
mkdir -p .next/standalone/gestion-commerciale/.next
cp -r .next/static .next/standalone/gestion-commerciale/.next/static

# Redémarrer PM2
pm2 restart gestion-commerciale
```

### Problème 2 : Les modals ne s'ouvrent pas

**Symptômes** : Clic sur les boutons sans réaction, pas d'erreur dans la console

**Diagnostic** :
```bash
# Vérifier l'import SweetAlert2
grep "sweetalert2" app/layout.tsx
```

**Solution** : Vérifiez que `app/layout.tsx` contient :
```typescript
import "sweetalert2/dist/sweetalert2.min.css";
```

Si l'import manque, ajoutez-le après les autres imports :
```bash
# Vérifier le contenu
cat app/layout.tsx | head -10
```

### Problème 3 : Erreur "Cannot find module"

**Symptômes** : Erreurs dans les logs PM2 concernant des modules manquants

**Solution** :
```bash
# Nettoyer et régénérer Prisma
rm -rf app/generated
npx prisma generate

# Rebuild
npm run build

# Redémarrer
pm2 restart gestion-commerciale
```

### Problème 4 : Erreur de connexion à la base de données

**Symptômes** : Erreurs "Can't reach database server" dans les logs

**Solution** :
```bash
# Vérifier MySQL
sudo systemctl status mysql

# Si arrêté, démarrer
sudo systemctl start mysql
sudo systemctl enable mysql

# Vérifier les variables d'environnement
cat .env | grep DATABASE_URL

# Tester la connexion
mysql -u ghostuser -p -e "SELECT 1;" gestion_commerciale
```

### Problème 5 : Page blanche ou erreurs JavaScript

**Symptômes** : Page charge mais reste blanche, erreurs dans la console du navigateur

**Diagnostic** :
1. Ouvrez la console du navigateur (F12)
2. Vérifiez l'onglet Console pour les erreurs
3. Vérifiez l'onglet Network pour les fichiers non chargés (404)

**Solution** :
```bash
# Vérifier que les fichiers statiques sont accessibles
curl -I http://localhost:4000/_next/static/

# Rebuild complet
rm -rf .next
npm run build
pm2 restart gestion-commerciale

# Vérifier les logs
pm2 logs gestion-commerciale --lines 50
```

### Problème 6 : Styles CSS non appliqués

**Symptômes** : Page fonctionne mais sans styles (texte brut)

**Solution** :
```bash
# Vérifier que globals.css est importé
grep "globals.css" app/layout.tsx

# Vérifier que Tailwind est configuré
ls -la tailwind.config.* postcss.config.*

# Rebuild
npm run build
pm2 restart gestion-commerciale
```

## Commandes utiles

```bash
# Redémarrer l'application
pm2 restart gestion-commerciale

# Voir les logs en temps réel
pm2 logs gestion-commerciale

# Voir les logs d'erreur uniquement
pm2 logs gestion-commerciale --err --lines 50

# Arrêter l'application
pm2 stop gestion-commerciale

# Voir le statut
pm2 status

# Voir les informations détaillées
pm2 describe gestion-commerciale
```

## Si rien ne fonctionne

Si après toutes ces étapes, l'application ne fonctionne toujours pas :

1. **Vérifiez les logs détaillés** :
   ```bash
   pm2 logs gestion-commerciale --lines 200
   ```

2. **Testez en mode développement** (temporairement) :
   ```bash
   pm2 stop gestion-commerciale
   npm run dev
   # (dans un autre terminal, testez l'application)
   ```

3. **Vérifiez les permissions** :
   ```bash
   ls -la .next/standalone/
   # Les fichiers doivent être lisibles
   ```

4. **Vérifiez l'espace disque** :
   ```bash
   df -h
   ```

## Support

Si vous rencontrez toujours des problèmes, notez :
- Les messages d'erreur exacts des logs PM2
- Les erreurs dans la console du navigateur (F12)
- Les erreurs réseau dans l'onglet Network du navigateur

