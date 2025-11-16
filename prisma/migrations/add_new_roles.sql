-- Script SQL pour ajouter les nouveaux rôles à la table utilisateur
-- Exécutez ce script directement dans votre base de données MySQL/MariaDB

ALTER TABLE `utilisateur`
MODIFY `role` ENUM(
      'admin',
      'pharmacien',
      'serveur',
      'caissier',
      'gerant_restaurant',
      'gerant_pharmacie',
      'bar',
      'location',
      -- nouveaux rôles
      'manager_multi',
      'caisse_restaurant',
      'caisse_bar',
      'caisse_location'
) NOT NULL;

