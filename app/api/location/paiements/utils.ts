import { prisma } from "@/lib/prisma";

let tauxChangeColumnEnsured = false;

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
    console.error("[paiements][columnExists]", { tableName, columnName, error });
    return false;
  }
}

export async function ensureTauxChangeColumn() {
  if (tauxChangeColumnEnsured) return;

  try {
    const exists = await columnExists("paiements", "taux_change");
    
    if (!exists) {
      console.log("[paiements][ensureTauxChangeColumn] Colonne taux_change manquante, création en cours...");
      
      await prisma.$executeRawUnsafe(`
        ALTER TABLE paiements 
        ADD COLUMN taux_change DECIMAL(10, 2) NULL
      `);
      
      // Mettre à jour les anciens paiements avec le taux par défaut
      await prisma.$executeRawUnsafe(`
        UPDATE paiements 
        SET taux_change = 2200 
        WHERE taux_change IS NULL
      `);
      
      console.log("[paiements][ensureTauxChangeColumn] Colonne taux_change créée avec succès");
    }
    
    tauxChangeColumnEnsured = true;
  } catch (error: any) {
    // Si la colonne existe déjà ou autre erreur, on continue
    if (error?.message?.includes("Duplicate column name")) {
      console.log("[paiements][ensureTauxChangeColumn] Colonne taux_change existe déjà");
      tauxChangeColumnEnsured = true;
    } else {
      console.error("[paiements][ensureTauxChangeColumn] Erreur:", error);
      // On continue quand même pour ne pas bloquer l'application
    }
  }
}

