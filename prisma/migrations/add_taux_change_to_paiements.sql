-- Migration pour ajouter le champ taux_change à la table paiements (paiements_location)
-- Ce champ stocke le taux de change utilisé au moment du paiement pour garantir la cohérence de l'affichage

USE gestion_commerciale;

-- Ajouter la colonne taux_change (nullable pour les anciens paiements)
ALTER TABLE paiements 
ADD COLUMN taux_change DECIMAL(10, 2) NULL;

-- Pour les anciens paiements sans taux_change, utiliser le taux actuel (2200 par défaut)
-- Cette valeur sera mise à jour lors de la prochaine consultation
UPDATE paiements 
SET taux_change = 2200 
WHERE taux_change IS NULL;

-- Vérifier que la colonne a été ajoutée
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'gestion_commerciale' 
AND TABLE_NAME = 'paiements' 
AND COLUMN_NAME = 'taux_change';

