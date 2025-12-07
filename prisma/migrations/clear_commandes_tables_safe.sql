-- Script SÉCURISÉ pour vider les tables de commandes
-- Version avec vérifications et compteurs avant suppression
-- ⚠️ ATTENTION : Ce script supprime TOUTES les données de commandes
-- Les stocks (boissons, medicament) et les données de base (repas, utilisateurs, etc.) sont préservés

USE gestion_commerciale;

-- Afficher le nombre d'enregistrements avant suppression
SELECT '=== COMPTAGE AVANT SUPPRESSION ===' AS info;
SELECT 'paiement' AS table_name, COUNT(*) AS count FROM paiement
UNION ALL
SELECT 'details_vente_pharmacie', COUNT(*) FROM details_vente_pharmacie
UNION ALL
SELECT 'vente_pharmacie', COUNT(*) FROM vente_pharmacie
UNION ALL
SELECT 'commande_boissons_restaurant', COUNT(*) FROM commande_boissons_restaurant
UNION ALL
SELECT 'details_commande', COUNT(*) FROM details_commande
UNION ALL
SELECT 'commande_details', COUNT(*) FROM commande_details
UNION ALL
SELECT 'factures', COUNT(*) FROM factures
UNION ALL
SELECT 'commande', COUNT(*) FROM commande
UNION ALL
SELECT 'commandes', COUNT(*) FROM commandes;

-- Désactiver temporairement les vérifications de clés étrangères
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Vider les paiements
DELETE FROM paiement;
SELECT '✓ paiement vidée' AS status;

-- 2. Vider les détails de ventes pharmacie
DELETE FROM details_vente_pharmacie;
SELECT '✓ details_vente_pharmacie vidée' AS status;

-- 3. Vider les ventes pharmacie
DELETE FROM vente_pharmacie;
SELECT '✓ vente_pharmacie vidée' AS status;

-- 4. Vider les boissons dans les commandes restaurant
DELETE FROM commande_boissons_restaurant;
SELECT '✓ commande_boissons_restaurant vidée' AS status;

-- 5. Vider les détails de commandes restaurant (plats)
DELETE FROM details_commande;
SELECT '✓ details_commande vidée' AS status;

-- 6. Vider les détails de commandes bar (boissons)
DELETE FROM commande_details;
SELECT '✓ commande_details vidée' AS status;

-- 7. Vider les factures (liées aux commandes bar)
DELETE FROM factures;
SELECT '✓ factures vidée' AS status;

-- 8. Vider les commandes restaurant
DELETE FROM commande;
SELECT '✓ commande vidée' AS status;

-- 9. Vider les commandes bar
DELETE FROM commandes;
SELECT '✓ commandes vidée' AS status;

-- Réactiver les vérifications de clés étrangères
SET FOREIGN_KEY_CHECKS = 1;

-- Afficher le nombre d'enregistrements après suppression
SELECT '=== COMPTAGE APRÈS SUPPRESSION ===' AS info;
SELECT 'paiement' AS table_name, COUNT(*) AS count FROM paiement
UNION ALL
SELECT 'details_vente_pharmacie', COUNT(*) FROM details_vente_pharmacie
UNION ALL
SELECT 'vente_pharmacie', COUNT(*) FROM vente_pharmacie
UNION ALL
SELECT 'commande_boissons_restaurant', COUNT(*) FROM commande_boissons_restaurant
UNION ALL
SELECT 'details_commande', COUNT(*) FROM details_commande
UNION ALL
SELECT 'commande_details', COUNT(*) FROM commande_details
UNION ALL
SELECT 'factures', COUNT(*) FROM factures
UNION ALL
SELECT 'commande', COUNT(*) FROM commande
UNION ALL
SELECT 'commandes', COUNT(*) FROM commandes;

SELECT '=== SUPPRESSION TERMINÉE ===' AS info;
SELECT 'Toutes les tables de commandes ont été vidées avec succès!' AS message;
SELECT 'Les stocks (boissons, medicament) et les données de base sont préservés.' AS note;

