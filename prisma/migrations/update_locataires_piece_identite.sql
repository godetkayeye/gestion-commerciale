-- Migration pour augmenter la taille de la colonne piece_identite
-- La colonne actuelle est VARCHAR(50) ce qui est trop court pour stocker les chemins de fichiers
-- On la modifie en VARCHAR(255) pour permettre de stocker des chemins complets

ALTER TABLE `locataires`
  MODIFY `piece_identite` VARCHAR(255) DEFAULT NULL;

