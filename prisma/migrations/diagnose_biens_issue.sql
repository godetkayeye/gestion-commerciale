-- Script de diagnostic pour le problème d'enregistrement de biens
-- Exécutez ce script sur votre base de données en ligne pour identifier le problème

-- 1. Vérifier que la table biens existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'biens'
        ) THEN '✓ Table biens existe'
        ELSE '✗ Table biens MANQUANTE'
    END AS check_table;

-- 2. Lister toutes les colonnes de la table biens
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_TYPE,
    COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'biens'
ORDER BY ORDINAL_POSITION;

-- 3. Vérifier spécifiquement les colonnes requises
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'biens' 
            AND COLUMN_NAME = 'nom'
        ) THEN '✓ Colonne nom existe'
        ELSE '✗ Colonne nom MANQUANTE - EXÉCUTEZ: ALTER TABLE `biens` ADD COLUMN `nom` VARCHAR(191) NULL AFTER `type`'
    END AS check_nom,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'biens' 
            AND COLUMN_NAME = 'niveau'
        ) THEN '✓ Colonne niveau existe'
        ELSE '✗ Colonne niveau MANQUANTE - EXÉCUTEZ: ALTER TABLE `biens` ADD COLUMN `niveau` ENUM(''rez_de_chaussee'',''n1'',''n2'',''n3'',''n4'') NULL AFTER `nom`'
    END AS check_niveau,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'biens' 
            AND COLUMN_NAME = 'nombre_pieces'
        ) THEN '✓ Colonne nombre_pieces existe'
        ELSE '✗ Colonne nombre_pieces MANQUANTE - EXÉCUTEZ: ALTER TABLE `biens` ADD COLUMN `nombre_pieces` INT NULL AFTER `etat`'
    END AS check_nombre_pieces;

-- 4. Vérifier les contraintes et index
SELECT 
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE,
    TABLE_NAME
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'biens';

-- 5. Tester une insertion simple (ne sera pas commitée)
START TRANSACTION;
INSERT INTO `biens` (
    `type`, 
    `nom`, 
    `niveau`, 
    `adresse`, 
    `superficie`, 
    `prix_mensuel`, 
    `nombre_pieces`, 
    `etat`
) VALUES (
    'APPARTEMENT',
    'Test Diagnostic',
    'rez_de_chaussee',
    'Adresse Test',
    50.00,
    100000.00,
    2,
    'LIBRE'
);
-- Si l'insertion réussit, on rollback pour ne pas créer de données de test
ROLLBACK;

SELECT 'Diagnostic terminé. Si vous voyez ce message, les colonnes existent et l''insertion de test a réussi.' AS result;

