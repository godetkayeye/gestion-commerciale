-- Migration pour ajouter la table de liaison entre commandes restaurant et boissons
-- Cette table permet d'inclure des boissons dans les commandes restaurant

-- Créer la table commande_boissons_restaurant
CREATE TABLE IF NOT EXISTS `commande_boissons_restaurant` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `commande_id` INT(11) NULL DEFAULT NULL,
  `boisson_id` INT(11) NULL DEFAULT NULL,
  `quantite` INT(11) NOT NULL DEFAULT 1,
  `prix_unitaire` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `prix_total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  INDEX `commande_boissons_restaurant_commande_id_idx` (`commande_id`),
  INDEX `commande_boissons_restaurant_boisson_id_idx` (`boisson_id`),
  CONSTRAINT `commande_boissons_restaurant_commande_fk` 
    FOREIGN KEY (`commande_id`) REFERENCES `commande` (`id`) ON DELETE CASCADE,
  CONSTRAINT `commande_boissons_restaurant_boisson_fk` 
    FOREIGN KEY (`boisson_id`) REFERENCES `boissons` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

