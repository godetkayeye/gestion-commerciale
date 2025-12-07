-- Migration pour changer la référence serveur_id dans commande de utilisateur vers personnel
-- Ce script supprime automatiquement toutes les contraintes sur serveur_id avant de migrer les données

-- ÉTAPE 1: Supprimer toutes les contraintes de clé étrangère sur serveur_id
-- On essaie de supprimer toutes les contraintes possibles (certaines peuvent ne pas exister)

-- Créer une procédure temporaire pour supprimer les contraintes
DELIMITER $$

DROP PROCEDURE IF EXISTS drop_serveur_constraints$$
CREATE PROCEDURE drop_serveur_constraints()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE constraint_name VARCHAR(255);
  DECLARE cur CURSOR FOR 
    SELECT CONSTRAINT_NAME 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'commande' 
      AND COLUMN_NAME = 'serveur_id'
      AND REFERENCED_TABLE_NAME IS NOT NULL;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO constraint_name;
    IF done THEN
      LEAVE read_loop;
    END IF;
    SET @sql = CONCAT('ALTER TABLE commande DROP FOREIGN KEY `', constraint_name, '`');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END LOOP;
  CLOSE cur;
END$$

DELIMITER ;

-- Exécuter la procédure pour supprimer toutes les contraintes
CALL drop_serveur_constraints();

-- Supprimer la procédure temporaire
DROP PROCEDURE IF EXISTS drop_serveur_constraints;

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
ALTER TABLE commande 
ADD CONSTRAINT commande_serveur_id_fkey 
FOREIGN KEY (serveur_id) REFERENCES personnel (id) ON DELETE SET NULL;

