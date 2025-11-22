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
    if (!nomExists) {
      try {
        await prisma.$executeRawUnsafe(
          "ALTER TABLE `biens` ADD COLUMN `nom` VARCHAR(191) NULL AFTER `type`"
        );
      } catch (error: any) {
        if (!error?.message?.includes("Duplicate column name")) {
          console.error("[biens][ensureColumns][nom]", error);
          throw error;
        }
      }
    }

    // Vérifier et ajouter la colonne 'niveau' si elle n'existe pas
    const niveauExists = await columnExists("biens", "niveau");
    if (!niveauExists) {
      try {
        await prisma.$executeRawUnsafe(
          "ALTER TABLE `biens` ADD COLUMN `niveau` ENUM('rez_de_chaussee','n1','n2','n3','n4') NULL AFTER `nom`"
        );
      } catch (error: any) {
        if (!error?.message?.includes("Duplicate column name")) {
          console.error("[biens][ensureColumns][niveau]", error);
          throw error;
        }
      }
    }

    // Vérifier et ajouter la colonne 'nombre_pieces' si elle n'existe pas
    const nombrePiecesExists = await columnExists("biens", "nombre_pieces");
    if (!nombrePiecesExists) {
      try {
        await prisma.$executeRawUnsafe(
          "ALTER TABLE `biens` ADD COLUMN `nombre_pieces` INT NULL AFTER `etat`"
        );
      } catch (error: any) {
        if (!error?.message?.includes("Duplicate column name")) {
          console.error("[biens][ensureColumns][nombre_pieces]", error);
          throw error;
        }
      }
    }

    biensColumnsEnsured = true;
  } catch (error: any) {
    console.error("[biens][ensureColumns][fatal]", error);
    // Ne pas bloquer l'exécution si les colonnes existent déjà
    // On marque quand même comme assuré pour éviter les boucles infinies
    biensColumnsEnsured = true;
  }
}

