-- Migration pour changer la référence serveur_id dans commande de utilisateur vers personnel
-- INSTRUCTIONS: Exécutez d'abord la requête ci-dessous pour trouver le nom exact de la contrainte,
-- puis supprimez-la manuellement avant d'exécuter le reste du script.

-- ÉTAPE 0: TROUVER LE NOM DE LA CONTRAINTE (exécutez cette requête d'abord)
-- SELECT CONSTRAINT_NAME 
-- FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
-- WHERE TABLE_SCHEMA = DATABASE() 
--   AND TABLE_NAME = 'commande' 
--   AND COLUMN_NAME = 'serveur_id' 
--   AND REFERENCED_TABLE_NAME = 'utilisateur';

-- ÉTAPE 1: SUPPRIMER LA CONTRAINTE MANUELLEMENT (remplacez 'commande_serveur_fk' par le nom trouvé ci-dessus)
-- ALTER TABLE commande DROP FOREIGN KEY commande_serveur_fk;
-- (Décommentez et exécutez la ligne ci-dessus avec le bon nom de contrainte)

-- ÉTAPE 2: Créer des enregistrements dans personnel pour les utilisateurs qui sont référencés comme serveurs
INSERT INTO personnel (nom, role)
SELECT DISTINCT u.nom, 'SERVEUR'
FROM utilisateur u
INNER JOIN commande c ON c.serveur_id = u.id
WHERE NOT EXISTS (
  SELECT 1 FROM personnel p WHERE p.nom = u.nom AND p.role = 'SERVEUR'
)
AND c.serveur_id IS NOT NULL;

-- ÉTAPE 3: Mettre à jour les serveur_id dans commande pour pointer vers les IDs de personnel
UPDATE commande c
INNER JOIN utilisateur u ON c.serveur_id = u.id
INNER JOIN personnel p ON p.nom = u.nom AND p.role = 'SERVEUR'
SET c.serveur_id = p.id
WHERE c.serveur_id IS NOT NULL;

-- ÉTAPE 4: Mettre à NULL les serveur_id qui ne peuvent pas être migrés
UPDATE commande
SET serveur_id = NULL
WHERE serveur_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM utilisateur WHERE id = commande.serveur_id
);

-- ÉTAPE 5: Vérifier qu'il n'y a plus de serveur_id invalides
UPDATE commande
SET serveur_id = NULL
WHERE serveur_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM personnel WHERE id = commande.serveur_id
);

-- ÉTAPE 6: Ajouter la nouvelle contrainte de clé étrangère vers personnel
ALTER TABLE commande 
ADD CONSTRAINT commande_serveur_id_fkey 
FOREIGN KEY (serveur_id) REFERENCES personnel (id) ON DELETE SET NULL;

