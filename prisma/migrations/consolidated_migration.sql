-- ============================================
-- MIGRATION CONSOLIDÉE
-- Ce fichier combine toutes les migrations suivantes :
-- - add_biens_details.sql
-- - add_commande_boissons_restaurant.sql
-- - add_commande_restaurant_id_to_commandes.sql
-- - update_locataires_piece_identite.sql
-- - update_restaurant_commandes.sql
-- ============================================

SET @dbname = DATABASE();

-- ============================================
-- PARTIE 1: Table BIENS
-- ============================================
-- Ajouter les nouvelles métadonnées pour les biens ACAJOU

SET @tablename = 'biens';
SET @columnname = 'nom';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE `', @tablename, '` ADD COLUMN `', @columnname, '` VARCHAR(191) NULL AFTER `type`')
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @columnname = 'niveau';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE `', @tablename, '` ADD COLUMN `', @columnname, '` ENUM(''rez_de_chaussee'', ''n1'', ''n2'', ''n3'', ''n4'') NULL AFTER `nom`')
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @columnname = 'nombre_pieces';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE `', @tablename, '` ADD COLUMN `', @columnname, '` INT NULL AFTER `etat`')
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- PARTIE 2: Table LOCATAIRES
-- ============================================
-- Augmenter la taille de la colonne piece_identite

SET @tablename = 'locataires';
SET @columnname = 'piece_identite';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
      AND (CHARACTER_MAXIMUM_LENGTH < 255)
  ) > 0,
  CONCAT('ALTER TABLE `', @tablename, '` MODIFY `', @columnname, '` VARCHAR(255) DEFAULT NULL'),
  'SELECT 1'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- PARTIE 3: Table COMMANDE
-- ============================================
-- Ajouter les champs nécessaires pour le suivi détaillé des commandes

SET @tablename = 'commande';

-- Ajouter serveur_id dans commande (si n'existe pas)
SET @columnname = 'serveur_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE `', @tablename, '` ADD COLUMN `', @columnname, '` INT NULL AFTER `utilisateur_id`')
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter caissier_id dans commande (si n'existe pas)
SET @columnname = 'caissier_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE `', @tablename, '` ADD COLUMN `', @columnname, '` INT NULL AFTER `serveur_id`')
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter total_dollars dans commande (si n'existe pas)
SET @columnname = 'total_dollars';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE `', @tablename, '` ADD COLUMN `', @columnname, '` DECIMAL(10,2) NULL AFTER `total`')
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter index pour serveur_id dans commande (si n'existe pas)
SET @indexname = 'commande_serveur_id_idx';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (index_name = @indexname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE `', @tablename, '` ADD INDEX `', @indexname, '` (`serveur_id`)')
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter index pour caissier_id dans commande (si n'existe pas)
SET @indexname = 'commande_caissier_id_idx';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (index_name = @indexname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE `', @tablename, '` ADD INDEX `', @indexname, '` (`caissier_id`)')
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter foreign key pour serveur_id dans commande (si n'existe pas)
SET @constraintname = 'commande_serveur_fk';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (constraint_name = @constraintname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE `', @tablename, '` ADD CONSTRAINT `', @constraintname, '` FOREIGN KEY (`serveur_id`) REFERENCES `utilisateur` (`id`) ON DELETE SET NULL')
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter foreign key pour caissier_id dans commande (si n'existe pas)
SET @constraintname = 'commande_caissier_fk';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (constraint_name = @constraintname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE `', @tablename, '` ADD CONSTRAINT `', @constraintname, '` FOREIGN KEY (`caissier_id`) REFERENCES `utilisateur` (`id`) ON DELETE SET NULL')
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- PARTIE 4: Table DETAILS_COMMANDE
-- ============================================
-- Ajouter prix_unitaire dans details_commande (si n'existe pas)

SET @tablename = 'details_commande';
SET @columnname = 'prix_unitaire';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE `', @tablename, '` ADD COLUMN `', @columnname, '` DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER `quantite`')
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- PARTIE 5: Table COMMANDES (Bar)
-- ============================================
-- Ajouter commande_restaurant_id pour lier les commandes bar aux commandes restaurant

SET @tablename = 'commandes';
SET @columnname = 'commande_restaurant_id';

-- Vérifier si la colonne existe
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
);

-- Ajouter la colonne si elle n'existe pas
SET @sql = IF(@col_exists = 0,
  CONCAT('ALTER TABLE `', @tablename, '` ADD COLUMN `', @columnname, '` INT NULL AFTER `serveur_id`'),
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter l'index si la colonne existe maintenant
SET @index_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND INDEX_NAME = 'commandes_commande_restaurant_id_idx'
);

SET @sql = IF(@index_exists = 0,
  CONCAT('ALTER TABLE `', @tablename, '` ADD INDEX `commandes_commande_restaurant_id_idx` (`', @columnname, '`)'),
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter la contrainte de clé étrangère si elle n'existe pas
SET @fk_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND CONSTRAINT_NAME = 'commandes_commande_restaurant_fk'
);

SET @sql = IF(@fk_exists = 0,
  CONCAT('ALTER TABLE `', @tablename, '` ADD CONSTRAINT `commandes_commande_restaurant_fk` FOREIGN KEY (`', @columnname, '`) REFERENCES `commande` (`id`) ON DELETE SET NULL'),
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- PARTIE 6: Table COMMANDE_BOISSONS_RESTAURANT
-- ============================================
-- Créer la table de liaison entre commandes restaurant et boissons
-- (Note: Cette table peut ne pas être utilisée si on utilise directement commandes_bar)

SET @tablename = 'commande_boissons_restaurant';
SET @table_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.TABLES 
  WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
);

SET @sql = IF(@table_exists = 0,
  CONCAT('CREATE TABLE `', @tablename, '` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `commande_id` INT(11) NULL DEFAULT NULL,
    `boisson_id` INT(11) NULL DEFAULT NULL,
    `quantite` INT(11) NOT NULL DEFAULT 1,
    `prix_unitaire` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `prix_total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (`id`),
    INDEX `commande_boissons_restaurant_commande_id_idx` (`commande_id`),
    INDEX `commande_boissons_restaurant_boisson_id_idx` (`boisson_id`),
    CONSTRAINT `commande_boissons_restaurant_commande_fk` 
      FOREIGN KEY (`commande_id`) REFERENCES `commande` (`id`) ON DELETE CASCADE,
    CONSTRAINT `commande_boissons_restaurant_boisson_fk` 
      FOREIGN KEY (`boisson_id`) REFERENCES `boissons` (`id`) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci'),
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
SELECT 'Migration consolidée terminée avec succès!' AS message;

