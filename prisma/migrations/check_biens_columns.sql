-- Script de vérification des colonnes de la table biens
-- Exécutez ce script pour vérifier que toutes les colonnes nécessaires existent

SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'biens'
ORDER BY ORDINAL_POSITION;

-- Vérifier spécifiquement les colonnes ajoutées par la migration
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'biens' 
            AND COLUMN_NAME = 'nom'
        ) THEN '✓ Colonne nom existe'
        ELSE '✗ Colonne nom MANQUANTE'
    END AS check_nom,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'biens' 
            AND COLUMN_NAME = 'niveau'
        ) THEN '✓ Colonne niveau existe'
        ELSE '✗ Colonne niveau MANQUANTE'
    END AS check_niveau,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'biens' 
            AND COLUMN_NAME = 'nombre_pieces'
        ) THEN '✓ Colonne nombre_pieces existe'
        ELSE '✗ Colonne nombre_pieces MANQUANTE'
    END AS check_nombre_pieces;

