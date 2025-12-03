-- Migration pour ajouter la gestion de vente en bouteille et en verre/mesure
-- 1 bouteille = 10 verres/mesures
-- Quand on vend 1 verre/mesure, on soustrait 0.1 bouteille du stock

USE gestion_commerciale;

-- Ajouter les colonnes à la table boissons
-- Note: Si les colonnes existent déjà, vous obtiendrez une erreur. 
-- Dans ce cas, ignorez simplement l'erreur ou supprimez les colonnes d'abord.
ALTER TABLE boissons 
ADD COLUMN prix_verre DECIMAL(10, 2) NULL,
ADD COLUMN vente_en_bouteille BOOLEAN DEFAULT TRUE,
ADD COLUMN vente_en_verre BOOLEAN DEFAULT FALSE;

-- Ajouter la colonne type_vente à la table commande_boissons_restaurant
ALTER TABLE commande_boissons_restaurant
ADD COLUMN type_vente VARCHAR(20) NULL;

-- Mettre à jour les boissons existantes : par défaut, elles sont vendues en bouteille uniquement
UPDATE boissons 
SET vente_en_bouteille = TRUE, 
    vente_en_verre = FALSE
WHERE vente_en_bouteille IS NULL OR vente_en_verre IS NULL;

