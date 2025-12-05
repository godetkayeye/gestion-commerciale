# Activation du démarrage automatique PM2

## ✅ Étape finale requise

Pour que PM2 démarre automatiquement au boot du serveur, vous devez exécuter la commande suivante :

```bash
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ghost --hp /home/ghost
```

Cette commande va :
- Créer un service systemd pour PM2
- Configurer PM2 pour démarrer automatiquement au boot
- Restaurer automatiquement toutes les applications PM2 sauvegardées

## 🔍 Vérification après activation

Après avoir exécuté la commande, vérifiez que tout fonctionne :

```bash
# Voir le statut PM2
pm2 status

# Voir les logs
pm2 logs gestion-commerciale

# Tester le redémarrage du serveur (optionnel, à faire en maintenance)
sudo reboot
# Après le reboot, vérifiez que PM2 a bien démarré :
pm2 status
```

## 📝 Note importante

Si vous modifiez la configuration PM2 (ajout/suppression d'applications), n'oubliez pas de sauvegarder :

```bash
pm2 save
```

