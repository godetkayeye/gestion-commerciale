-- Migration pour ajouter commande_restaurant_id à la table commandes
-- Cette colonne permet de lier les commandes bar (boissons) aux commandes restaurant (plats)

-- Ajouter la colonne commande_restaurant_id si elle n'existe pas
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'commandes'
    AND COLUMN_NAME = 'commande_restaurant_id'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `commandes` ADD COLUMN `commande_restaurant_id` INT NULL AFTER `serveur_id`',
  'SELECT "La colonne commande_restaurant_id existe déjà" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter l'index si la colonne existe
SET @index_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'commandes'
    AND INDEX_NAME = 'commandes_commande_restaurant_id_idx'
);

SET @sql = IF(@index_exists = 0 AND @col_exists = 0,
  'CREATE INDEX `commandes_commande_restaurant_id_idx` ON `commandes` (`commande_restaurant_id`)',
  'SELECT "L''index existe déjà ou la colonne n''existe pas" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter la contrainte de clé étrangère si elle n'existe pas
SET @fk_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'commandes'
    AND CONSTRAINT_NAME = 'commandes_commande_restaurant_fk'
);

SET @sql = IF(@fk_exists = 0 AND @col_exists = 0,
  'ALTER TABLE `commandes` ADD CONSTRAINT `commandes_commande_restaurant_fk` FOREIGN KEY (`commande_restaurant_id`) REFERENCES `commande` (`id`) ON DELETE SET NULL',
  'SELECT "La contrainte existe déjà ou la colonne n''existe pas" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


