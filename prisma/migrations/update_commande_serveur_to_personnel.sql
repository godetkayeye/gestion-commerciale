-- Migration pour changer la référence serveur_id dans commande de utilisateur vers personnel
-- Cette migration met à jour la contrainte de clé étrangère pour que serveur_id référence personnel au lieu de utilisateur

-- ÉTAPE 1: Supprimer TOUTES les contraintes de clé étrangère sur serveur_id (si elles existent)
-- Il faut d'abord supprimer toutes les contraintes pour pouvoir modifier les données
-- MySQL peut avoir plusieurs contraintes avec des noms différents, on les supprime toutes

-- Supprimer la contrainte commande_serveur_fk (si elle existe)
SET @dbname = DATABASE();
SET @tablename = 'commande';
SET @constraintname = 'commande_serveur_fk';

SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (constraint_name = @constraintname)
  ) > 0,
  CONCAT('ALTER TABLE `', @tablename, '` DROP FOREIGN KEY `', @constraintname, '`'),
  'SELECT 1' -- Contrainte n'existe pas, ne rien faire
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer la contrainte commande_serveur_id_fkey (si elle existe)
SET @constraintname = 'commande_serveur_id_fkey';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (constraint_name = @constraintname)
  ) > 0,
  CONCAT('ALTER TABLE `', @tablename, '` DROP FOREIGN KEY `', @constraintname, '`'),
  'SELECT 1' -- Contrainte n'existe pas, ne rien faire
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Note: Si d'autres contraintes existent avec des noms différents, 
-- vous devrez peut-être les supprimer manuellement avec:
-- ALTER TABLE commande DROP FOREIGN KEY nom_de_la_contrainte;

-- ÉTAPE 2: Créer des enregistrements dans personnel pour les utilisateurs qui sont référencés comme serveurs
-- mais qui n'existent pas encore dans personnel
INSERT INTO personnel (nom, role)
SELECT DISTINCT u.nom, 'SERVEUR'
FROM utilisateur u
INNER JOIN commande c ON c.serveur_id = u.id
WHERE NOT EXISTS (
  SELECT 1 FROM personnel p WHERE p.nom = u.nom AND p.role = 'SERVEUR'
)
AND c.serveur_id IS NOT NULL;

-- ÉTAPE 3: Mettre à jour les serveur_id dans commande pour pointer vers les IDs de personnel
-- au lieu des IDs de utilisateur
UPDATE commande c
INNER JOIN utilisateur u ON c.serveur_id = u.id
INNER JOIN personnel p ON p.nom = u.nom AND p.role = 'SERVEUR'
SET c.serveur_id = p.id
WHERE c.serveur_id IS NOT NULL;

-- ÉTAPE 4: Mettre à NULL les serveur_id qui ne peuvent pas être migrés
-- (cas où serveur_id ne correspond à aucun utilisateur valide)
UPDATE commande
SET serveur_id = NULL
WHERE serveur_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM utilisateur WHERE id = commande.serveur_id
);

-- ÉTAPE 5: Vérifier qu'il n'y a plus de serveur_id invalides
-- (qui référencent des IDs qui n'existent pas dans personnel)
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

