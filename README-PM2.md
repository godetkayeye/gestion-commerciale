# Configuration PM2 pour gestion-commerciale

## Problème résolu

Si votre serveur VPS se ferme de lui-même et que vous devez redémarrer PM2 manuellement, c'est parce que :
1. PM2 n'était pas configuré pour démarrer automatiquement au boot
2. PM2 n'était pas configuré pour redémarrer automatiquement en cas de crash

## Solution

### 1. Exécuter le script de configuration

```bash
cd /var/www/ghostapp/gestion-commerciale
chmod +x setup-pm2.sh
./setup-pm2.sh
```

**Important** : À la fin du script, PM2 affichera une commande `sudo env PATH=... pm2 startup ...`. **Vous devez copier et exécuter cette commande** pour activer le démarrage automatique au boot.

### 2. Vérifier que tout fonctionne

```bash
# Voir le statut
pm2 status

# Voir les logs en temps réel
pm2 logs

# Monitorer les ressources (CPU, mémoire)
pm2 monit
```

## Commandes PM2 utiles

```bash
# Voir le statut
pm2 status

# Voir les logs
pm2 logs gestion-commerciale
pm2 logs --lines 100  # Dernières 100 lignes

# Redémarrer
pm2 restart gestion-commerciale
pm2 restart all

# Arrêter
pm2 stop gestion-commerciale
pm2 stop all

# Supprimer
pm2 delete gestion-commerciale
pm2 delete all

# Monitorer (CPU, mémoire, etc.)
pm2 monit

# Sauvegarder la configuration actuelle
pm2 save

# Recharger la configuration (sans downtime)
pm2 reload gestion-commerciale
```

## Vérifier les logs en cas de problème

```bash
# Logs PM2
tail -f /var/www/ghostapp/gestion-commerciale/logs/pm2-out.log
tail -f /var/www/ghostapp/gestion-commerciale/logs/pm2-error.log

# Ou via PM2
pm2 logs gestion-commerciale --err
pm2 logs gestion-commerciale --out
```

## Configuration actuelle

- **Autorestart** : Activé (redémarre automatiquement en cas de crash)
- **Max memory restart** : 1GB (redémarre si la mémoire dépasse 1GB)
- **Max restarts** : 10 redémarrages maximum
- **Restart delay** : 4 secondes entre les redémarrages
- **Startup au boot** : Activé (après exécution de la commande `pm2 startup`)

## En cas de problème persistant

1. Vérifier les logs d'erreur :
   ```bash
   pm2 logs gestion-commerciale --err --lines 50
   ```

2. Vérifier l'utilisation des ressources :
   ```bash
   pm2 monit
   ```

3. Vérifier les logs système :
   ```bash
   journalctl -u pm2-ghost.service -n 50  # Si systemd est utilisé
   ```

4. Vérifier l'espace disque :
   ```bash
   df -h
   ```

5. Vérifier la mémoire disponible :
   ```bash
   free -h
   ```

