-- Ajoute les nouvelles métadonnées pour les biens ACAJOU
-- À exécuter manuellement sur la base de données MySQL/MariaDB

ALTER TABLE `biens`
  ADD COLUMN `nom` VARCHAR(191) NULL AFTER `type`,
  ADD COLUMN `niveau` ENUM('rez_de_chaussee', 'n1', 'n2', 'n3', 'n4') NULL AFTER `nom`,
  ADD COLUMN `nombre_pieces` INT NULL AFTER `etat`;
