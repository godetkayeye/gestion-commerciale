-- Migration pour ajouter la gestion de vente en bouteille et en verre/mesure
-- 1 bouteille = 10 verres/mesures
-- Quand on vend 1 verre/mesure, on soustrait 0.1 bouteille du stock

USE gestion_commerciale;

-- Ajouter les colonnes à la table boissons (si elles n'existent pas déjà)
ALTER TABLE boissons 
ADD COLUMN IF NOT EXISTS prix_verre DECIMAL(10, 2) NULL,
ADD COLUMN IF NOT EXISTS vente_en_bouteille BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS vente_en_verre BOOLEAN DEFAULT FALSE;

-- Ajouter la colonne type_vente à la table commande_boissons_restaurant (si elle n'existe pas déjà)
ALTER TABLE commande_boissons_restaurant
ADD COLUMN IF NOT EXISTS type_vente VARCHAR(20) NULL;

-- Mettre à jour les boissons existantes : par défaut, elles sont vendues en bouteille uniquement
UPDATE boissons 
SET vente_en_bouteille = TRUE, 
    vente_en_verre = FALSE
WHERE vente_en_bouteille IS NULL OR vente_en_verre IS NULL;

