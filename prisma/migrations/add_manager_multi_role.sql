-- Migration pour ajouter MANAGER_MULTI, CONSEIL_ADMINISTRATION, SUPERVISEUR et CAISSE_LOCATION à l'enum Role
-- Cette migration est idempotente : elle peut être exécutée plusieurs fois sans erreur

USE gestion_commerciale;

-- Vérifier si MANAGER_MULTI existe déjà dans l'enum
SET @has_manager_multi = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = 'gestion_commerciale' 
    AND TABLE_NAME = 'utilisateur' 
    AND COLUMN_NAME = 'role' 
    AND COLUMN_TYPE LIKE '%MANAGER_MULTI%'
);

-- Si MANAGER_MULTI n'existe pas, modifier l'enum
SET @sql = IF(@has_manager_multi = 0,
  'ALTER TABLE utilisateur MODIFY COLUMN role ENUM(
    ''ADMIN'',
    ''MANAGER'',
    ''MANAGER_MULTI'',
    ''CAISSIER'',
    ''CAISSE_RESTAURANT'',
    ''CAISSE_BAR'',
    ''ECONOMAT'',
    ''MAGASINIER'',
    ''LOCATION'',
    ''CAISSE_PHARMACIE'',
    ''PHARMACIE'',
    ''STOCK'',
    ''OTHER'',
    ''CONSEIL_ADMINISTRATION'',
    ''SUPERVISEUR'',
    ''CAISSE_LOCATION''
  ) NOT NULL',
  'SELECT ''MANAGER_MULTI already exists in enum Role'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Afficher le résultat
SELECT 'Migration add_manager_multi_role completed successfully' AS status;

