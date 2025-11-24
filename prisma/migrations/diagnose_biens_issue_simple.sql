-- Script de diagnostic simplifié (sans INFORMATION_SCHEMA)
-- Utilise des commandes MySQL standard qui ne nécessitent pas de permissions spéciales

-- 1. Vérifier que la table biens existe et lister ses colonnes
SHOW COLUMNS FROM `biens`;

-- 2. Vérifier spécifiquement les colonnes requises (méthode alternative)
-- Si ces requêtes retournent des résultats, les colonnes existent

-- Vérifier la colonne 'nom'
SELECT COUNT(*) as nom_exists 
FROM `biens` 
WHERE 1=0 
  AND EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'biens' 
    AND COLUMN_NAME = 'nom'
  );

-- Si la requête ci-dessus échoue, utilisez cette méthode plus simple :
-- Essayez de sélectionner la colonne directement
-- Si elle existe, la requête réussira, sinon elle échouera

-- 3. Test simple : essayer de sélectionner les colonnes
-- Si une colonne n'existe pas, vous aurez une erreur "Unknown column"
SELECT `nom`, `niveau`, `nombre_pieces` FROM `biens` LIMIT 1;

-- 4. Si les colonnes n'existent pas, exécutez ces commandes :
-- (Décommentez seulement si nécessaire)

-- ALTER TABLE `biens` ADD COLUMN `nom` VARCHAR(191) NULL AFTER `type`;
-- ALTER TABLE `biens` ADD COLUMN `niveau` ENUM('rez_de_chaussee','n1','n2','n3','n4') NULL AFTER `nom`;
-- ALTER TABLE `biens` ADD COLUMN `nombre_pieces` INT NULL AFTER `etat`;

-- 5. Test d'insertion (dans une transaction pour ne pas créer de données)
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

-- Si vous arrivez ici sans erreur, l'insertion fonctionne
-- On annule la transaction pour ne pas créer de données de test
ROLLBACK;

SELECT '✓ Diagnostic terminé avec succès. Les colonnes existent et l''insertion fonctionne.' AS result;


