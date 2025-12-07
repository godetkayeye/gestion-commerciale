# Instructions pour la migration serveur_id

## Problème
La contrainte `commande_serveur_fk` empêche la migration des données.

## Solution : Exécutez ces commandes dans MySQL

### Étape 1 : Trouver le nom exact de la contrainte
```sql
SELECT CONSTRAINT_NAME 
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'commande' 
  AND COLUMN_NAME = 'serveur_id' 
  AND REFERENCED_TABLE_NAME = 'utilisateur';
```

### Étape 2 : Supprimer la contrainte (remplacez 'commande_serveur_fk' par le nom trouvé)
```sql
ALTER TABLE commande DROP FOREIGN KEY commande_serveur_fk;
```

### Étape 3 : Exécuter le script de migration
```bash
mysql -u root -p gestion_commerciale < prisma/migrations/update_commande_serveur_to_personnel_manual.sql
```

Ou exécutez directement dans MySQL :

```sql
-- Créer des enregistrements dans personnel pour les utilisateurs référencés
INSERT INTO personnel (nom, role)
SELECT DISTINCT u.nom, 'SERVEUR'
FROM utilisateur u
INNER JOIN commande c ON c.serveur_id = u.id
WHERE NOT EXISTS (
  SELECT 1 FROM personnel p WHERE p.nom = u.nom AND p.role = 'SERVEUR'
)
AND c.serveur_id IS NOT NULL;

-- Mettre à jour les serveur_id
UPDATE commande c
INNER JOIN utilisateur u ON c.serveur_id = u.id
INNER JOIN personnel p ON p.nom = u.nom AND p.role = 'SERVEUR'
SET c.serveur_id = p.id
WHERE c.serveur_id IS NOT NULL;

-- Nettoyer les serveur_id invalides
UPDATE commande
SET serveur_id = NULL
WHERE serveur_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM utilisateur WHERE id = commande.serveur_id
);

UPDATE commande
SET serveur_id = NULL
WHERE serveur_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM personnel WHERE id = commande.serveur_id
);

-- Ajouter la nouvelle contrainte
ALTER TABLE commande 
ADD CONSTRAINT commande_serveur_id_fkey 
FOREIGN KEY (serveur_id) REFERENCES personnel (id) ON DELETE SET NULL;
```

