-- Script SQL pour créer la table configuration
-- À exécuter en local ET sur le VPS avant npx prisma generate

USE gestion_commerciale;

-- Créer la table configuration pour stocker les paramètres système
CREATE TABLE IF NOT EXISTS configuration (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cle VARCHAR(191) NOT NULL UNIQUE,
  valeur TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insérer le taux de change par défaut (1 $ = 2200 FC)
INSERT INTO configuration (cle, valeur) 
VALUES ('taux_change', '2200')
ON DUPLICATE KEY UPDATE valeur = '2200';

-- Vérifier que la table a été créée
SELECT * FROM configuration;

