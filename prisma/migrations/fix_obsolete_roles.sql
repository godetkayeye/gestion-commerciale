-- Migration pour corriger les rôles obsolètes dans la table utilisateur
-- Cette migration met à jour les anciens rôles vers les nouveaux rôles valides

-- Vérifier si la colonne role existe et mettre à jour les rôles obsolètes
-- Note: Les valeurs dans la base de données sont stockées en minuscules avec @map dans Prisma

-- Mettre à jour 'bar' vers 'caisse_bar'
UPDATE utilisateur 
SET role = 'caisse_bar' 
WHERE role = 'bar' OR role = 'BAR';

-- Mettre à jour 'gerant_restaurant' vers 'caisse_restaurant'
UPDATE utilisateur 
SET role = 'caisse_restaurant' 
WHERE role = 'gerant_restaurant' OR role = 'GERANT_RESTAURANT';

-- Mettre à jour 'serveur' vers 'caissier'
UPDATE utilisateur 
SET role = 'caissier' 
WHERE role = 'serveur' OR role = 'SERVEUR';

-- Mettre à jour 'gerant_pharmacie' vers 'caissier'
UPDATE utilisateur 
SET role = 'caissier' 
WHERE role = 'gerant_pharmacie' OR role = 'GERANT_PHARMACIE';

-- Mettre à jour 'pharmacien' vers 'caissier'
UPDATE utilisateur 
SET role = 'caissier' 
WHERE role = 'pharmacien' OR role = 'PHARMACIEN';

-- Vérifier qu'il ne reste que des rôles valides
-- Les rôles valides sont (en minuscules comme stockés dans la DB):
-- 'admin', 'caissier', 'location', 'manager_multi', 'caisse_restaurant', 
-- 'caisse_bar', 'caisse_location', 'conseil_administration', 'superviseur', 'economat'

SELECT 
  role, 
  COUNT(*) as count 
FROM utilisateur 
GROUP BY role 
ORDER BY role;

