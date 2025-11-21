-- Migration pour améliorer les commandes restaurant
-- Ajoute les champs nécessaires pour le suivi détaillé des commandes
-- NOTE: La table paiement est déjà complète (devise et caissier_id existent déjà)

-- ============================================
-- PARTIE 1: Table COMMANDE
-- ============================================

-- Ajouter serveur_id dans commande (si n'existe pas)
SET @dbname = DATABASE();
SET @tablename = 'commande';
SET @columnname = 'serveur_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1', -- Colonne existe déjà, ne rien faire
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
  'SELECT 1', -- Colonne existe déjà, ne rien faire
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
  'SELECT 1', -- Colonne existe déjà, ne rien faire
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
  'SELECT 1', -- Index existe déjà, ne rien faire
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
  'SELECT 1', -- Index existe déjà, ne rien faire
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
  'SELECT 1', -- Contrainte existe déjà, ne rien faire
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
  'SELECT 1', -- Contrainte existe déjà, ne rien faire
  CONCAT('ALTER TABLE `', @tablename, '` ADD CONSTRAINT `', @constraintname, '` FOREIGN KEY (`caissier_id`) REFERENCES `utilisateur` (`id`) ON DELETE SET NULL')
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- PARTIE 2: Table DETAILS_COMMANDE
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
  'SELECT 1', -- Colonne existe déjà, ne rien faire
  CONCAT('ALTER TABLE `', @tablename, '` ADD COLUMN `', @columnname, '` DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER `quantite`')
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
