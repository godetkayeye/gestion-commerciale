# Guide pour résoudre le conflit Git sur le VPS

## Situation
Vous avez un conflit dans `prisma/schema.prisma` après avoir fait `git pull` sur votre VPS.

## Solution recommandée : Accepter la version de GitHub

La version sur GitHub contient toutes les dernières modifications (système unifié de commandes, gestion des rôles, etc.).

### Option 1 : Accepter complètement la version GitHub (recommandé)

```bash
# Sur le VPS, dans le répertoire du projet
cd /var/www/ghostapp/gestion-commerciale

# Annuler le merge en cours
git merge --abort

# Accepter la version de GitHub pour schema.prisma
git checkout --theirs prisma/schema.prisma

# Ou si vous voulez garder vos modifications locales (non recommandé)
# git checkout --ours prisma/schema.prisma

# Ajouter le fichier résolu
git add prisma/schema.prisma

# Finaliser le merge
git commit -m "fix: Résolution du conflit dans schema.prisma - acceptation de la version GitHub"

# Régénérer le client Prisma
npx prisma generate

# Redémarrer l'application
pm2 restart all
```

### Option 2 : Fusionner manuellement (si vous avez des modifications importantes sur le VPS)

```bash
# Sur le VPS
cd /var/www/ghostapp/gestion-commerciale

# Ouvrir le fichier avec nano
nano prisma/schema.prisma

# Chercher les marqueurs de conflit :
# <<<<<<< HEAD
# (votre version locale)
# =======
# (version GitHub)
# >>>>>>> origin/main

# Supprimer les marqueurs et garder la version GitHub (ou fusionner manuellement)
# Sauvegarder avec Ctrl+O, puis Ctrl+X

# Ajouter le fichier résolu
git add prisma/schema.prisma

# Finaliser le merge
git commit -m "fix: Résolution du conflit dans schema.prisma"

# Régénérer le client Prisma
npx prisma generate

# Redémarrer l'application
pm2 restart all
```

### Option 3 : Réinitialiser complètement (si vous n'avez pas de modifications importantes sur le VPS)

```bash
# Sur le VPS
cd /var/www/ghostapp/gestion-commerciale

# Sauvegarder vos modifications locales (si nécessaire)
git stash

# Annuler le merge
git merge --abort

# Récupérer la dernière version
git pull origin main

# Régénérer le client Prisma
npx prisma generate

# Redémarrer l'application
pm2 restart all
```

## Points importants

1. **La version GitHub est la version de référence** - elle contient toutes les dernières fonctionnalités
2. **Régénérez toujours Prisma** après avoir modifié `schema.prisma` : `npx prisma generate`
3. **Redémarrez l'application** après les modifications : `pm2 restart all`

## Vérification

Après résolution, vérifiez que tout fonctionne :

```bash
# Vérifier l'état Git
git status

# Vérifier que Prisma est à jour
npx prisma validate

# Vérifier que l'application démarre
pm2 logs gestion-commerciale --lines 50
```

