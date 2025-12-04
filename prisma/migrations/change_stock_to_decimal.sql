-- Migration pour permettre les valeurs décimales dans le stock des boissons
-- Permet d'enregistrer des bouteilles partiellement ouvertes (ex: 0.7 bouteille = 7 verres restants)

-- Modifier la colonne stock dans la table boissons
ALTER TABLE boissons 
MODIFY COLUMN stock DECIMAL(10, 2) DEFAULT 0;

-- Modifier la colonne quantite dans la table mouvements_stock
ALTER TABLE mouvements_stock 
MODIFY COLUMN quantite DECIMAL(10, 2);

