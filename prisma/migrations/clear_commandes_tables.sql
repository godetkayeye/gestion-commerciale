-- Script pour vider toutes les tables de commandes
-- ⚠️ ATTENTION : Ce script supprime TOUTES les données de commandes
-- Les stocks (boissons, medicament) et les données de base (repas, utilisateurs, etc.) sont préservés

USE gestion_commerciale;

-- Désactiver temporairement les vérifications de clés étrangères
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Vider les paiements (peuvent référencer des commandes via reference_id)
DELETE FROM paiement;

-- 2. Vider les détails de ventes pharmacie
DELETE FROM details_vente_pharmacie;

-- 3. Vider les ventes pharmacie
DELETE FROM vente_pharmacie;

-- 4. Vider les boissons dans les commandes restaurant
DELETE FROM commande_boissons_restaurant;

-- 5. Vider les détails de commandes restaurant (plats)
DELETE FROM details_commande;

-- 6. Vider les détails de commandes bar (boissons)
DELETE FROM commande_details;

-- 7. Vider les factures (liées aux commandes bar)
DELETE FROM factures;

-- 8. Vider les commandes restaurant
DELETE FROM commande;

-- 9. Vider les commandes bar
DELETE FROM commandes;

-- Réactiver les vérifications de clés étrangères
SET FOREIGN_KEY_CHECKS = 1;

-- Afficher un message de confirmation
SELECT 'Toutes les tables de commandes ont été vidées avec succès!' AS message;

