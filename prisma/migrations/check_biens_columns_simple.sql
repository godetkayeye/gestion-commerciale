-- Script simple pour vérifier les colonnes de la table biens
-- Utilise SHOW COLUMNS qui ne nécessite pas de permissions spéciales

-- Lister toutes les colonnes de la table biens
SHOW COLUMNS FROM `biens`;

-- Vérifier si les colonnes spécifiques existent en essayant de les sélectionner
-- Si une colonne n'existe pas, vous aurez une erreur "Unknown column 'nom'"

-- Test 1: Colonne 'nom'
SELECT `nom` FROM `biens` LIMIT 0;

-- Test 2: Colonne 'niveau'  
SELECT `niveau` FROM `biens` LIMIT 0;

-- Test 3: Colonne 'nombre_pieces'
SELECT `nombre_pieces` FROM `biens` LIMIT 0;

-- Si toutes les requêtes ci-dessus réussissent (même avec LIMIT 0),
-- cela signifie que les colonnes existent.

-- Si vous obtenez une erreur "Unknown column", exécutez les commandes suivantes :

-- ALTER TABLE `biens` ADD COLUMN `nom` VARCHAR(191) NULL AFTER `type`;
-- ALTER TABLE `biens` ADD COLUMN `niveau` ENUM('rez_de_chaussee','n1','n2','n3','n4') NULL AFTER `nom`;
-- ALTER TABLE `biens` ADD COLUMN `nombre_pieces` INT NULL AFTER `etat`;


