-- Migration pour changer la référence serveur_id dans commande de utilisateur vers personnel
-- Version 2: Script simplifié qui supprime toutes les contraintes possibles

-- ÉTAPE 1: Supprimer toutes les contraintes de clé étrangère connues sur serveur_id
-- Supprimer la contrainte commande_serveur_fk
SET @dbname = DATABASE();
SET @tablename = 'commande';

-- Supprimer commande_serveur_fk
SET @sql = CONCAT('ALTER TABLE `', @tablename, '` DROP FOREIGN KEY IF EXISTS `commande_serveur_fk`');
SET @preparedStatement = @sql;
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer commande_serveur_id_fkey
SET @sql = CONCAT('ALTER TABLE `', @tablename, '` DROP FOREIGN KEY IF EXISTS `commande_serveur_id_fkey`');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Note: Si MySQL ne supporte pas "IF EXISTS", utilisez cette approche alternative:
-- D'abord, trouvez le nom exact de la contrainte avec:
-- SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
-- WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'commande' AND COLUMN_NAME = 'serveur_id' AND REFERENCED_TABLE_NAME = 'utilisateur';

-- ÉTAPE 2: Créer des enregistrements dans personnel pour les utilisateurs qui sont référencés comme serveurs
INSERT INTO personnel (nom, role)
SELECT DISTINCT u.nom, 'SERVEUR'
FROM utilisateur u
INNER JOIN commande c ON c.serveur_id = u.id
WHERE NOT EXISTS (
  SELECT 1 FROM personnel p WHERE p.nom = u.nom AND p.role = 'SERVEUR'
)
AND c.serveur_id IS NOT NULL;

-- ÉTAPE 3: Mettre à jour les serveur_id dans commande pour pointer vers les IDs de personnel
UPDATE commande c
INNER JOIN utilisateur u ON c.serveur_id = u.id
INNER JOIN personnel p ON p.nom = u.nom AND p.role = 'SERVEUR'
SET c.serveur_id = p.id
WHERE c.serveur_id IS NOT NULL;

-- ÉTAPE 4: Mettre à NULL les serveur_id qui ne peuvent pas être migrés
UPDATE commande
SET serveur_id = NULL
WHERE serveur_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM utilisateur WHERE id = commande.serveur_id
);

-- ÉTAPE 5: Vérifier qu'il n'y a plus de serveur_id invalides
UPDATE commande
SET serveur_id = NULL
WHERE serveur_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM personnel WHERE id = commande.serveur_id
);

-- ÉTAPE 6: Ajouter la nouvelle contrainte de clé étrangère vers personnel
SET @constraintname = 'commande_serveur_id_fkey';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (constraint_name = @constraintname)
  ) > 0,
  'SELECT 1', -- Contrainte existe déjà, ne rien faire
  CONCAT('ALTER TABLE `', @tablename, '` ADD CONSTRAINT `', @constraintname, '` FOREIGN KEY (`serveur_id`) REFERENCES `personnel` (`id`) ON DELETE SET NULL')
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

