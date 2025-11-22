import { prisma } from "@/lib/prisma";

let biensColumnsEnsured = false;

async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    const result = await prisma.$queryRawUnsafe<Array<{ COLUMN_NAME: string }>>(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = ? 
       AND COLUMN_NAME = ?`,
      tableName,
      columnName
    );
    return result.length > 0;
  } catch (error) {
    console.error("[biens][columnExists]", { tableName, columnName, error });
    return false;
  }
}

export async function ensureBiensExtendedColumns() {
  if (biensColumnsEnsured) return;

  try {
    // Vérifier et ajouter la colonne 'nom' si elle n'existe pas
    const nomExists = await columnExists("biens", "nom");
    console.log("[biens][ensureColumns] Colonne 'nom' existe:", nomExists);
    if (!nomExists) {
      try {
        console.log("[biens][ensureColumns] Ajout de la colonne 'nom'...");
        await prisma.$executeRawUnsafe(
          "ALTER TABLE `biens` ADD COLUMN `nom` VARCHAR(191) NULL AFTER `type`"
        );
        console.log("[biens][ensureColumns] Colonne 'nom' ajoutée avec succès");
      } catch (error: any) {
        if (!error?.message?.includes("Duplicate column name")) {
          console.error("[biens][ensureColumns][nom] Erreur:", {
            message: error?.message,
            code: error?.code,
            error: error,
          });
          // Ne pas throw, on continue pour les autres colonnes
        }
      }
    }

    // Vérifier et ajouter la colonne 'niveau' si elle n'existe pas
    const niveauExists = await columnExists("biens", "niveau");
    console.log("[biens][ensureColumns] Colonne 'niveau' existe:", niveauExists);
    if (!niveauExists) {
      try {
        console.log("[biens][ensureColumns] Ajout de la colonne 'niveau'...");
        await prisma.$executeRawUnsafe(
          "ALTER TABLE `biens` ADD COLUMN `niveau` ENUM('rez_de_chaussee','n1','n2','n3','n4') NULL AFTER `nom`"
        );
        console.log("[biens][ensureColumns] Colonne 'niveau' ajoutée avec succès");
      } catch (error: any) {
        if (!error?.message?.includes("Duplicate column name")) {
          console.error("[biens][ensureColumns][niveau] Erreur:", {
            message: error?.message,
            code: error?.code,
            error: error,
          });
          // Ne pas throw, on continue pour les autres colonnes
        }
      }
    }

    // Vérifier et ajouter la colonne 'nombre_pieces' si elle n'existe pas
    const nombrePiecesExists = await columnExists("biens", "nombre_pieces");
    console.log("[biens][ensureColumns] Colonne 'nombre_pieces' existe:", nombrePiecesExists);
    if (!nombrePiecesExists) {
      try {
        console.log("[biens][ensureColumns] Ajout de la colonne 'nombre_pieces'...");
        await prisma.$executeRawUnsafe(
          "ALTER TABLE `biens` ADD COLUMN `nombre_pieces` INT NULL AFTER `etat`"
        );
        console.log("[biens][ensureColumns] Colonne 'nombre_pieces' ajoutée avec succès");
      } catch (error: any) {
        if (!error?.message?.includes("Duplicate column name")) {
          console.error("[biens][ensureColumns][nombre_pieces] Erreur:", {
            message: error?.message,
            code: error?.code,
            error: error,
          });
          // Ne pas throw, on continue
        }
      }
    }

    biensColumnsEnsured = true;
    console.log("[biens][ensureColumns] Vérification terminée");
  } catch (error: any) {
    console.error("[biens][ensureColumns][fatal] Erreur fatale:", {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      error: error,
    });
    // Ne pas bloquer l'exécution si les colonnes existent déjà
    // On marque quand même comme assuré pour éviter les boucles infinies
    biensColumnsEnsured = true;
  }
}

