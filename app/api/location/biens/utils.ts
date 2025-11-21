import { prisma } from "@/lib/prisma";

let biensColumnsEnsured = false;

export async function ensureBiensExtendedColumns() {
  if (biensColumnsEnsured) return;

  const statements = [
    "ALTER TABLE `biens` ADD COLUMN IF NOT EXISTS `nom` VARCHAR(191) NULL AFTER `type`",
    "ALTER TABLE `biens` ADD COLUMN IF NOT EXISTS `niveau` ENUM('rez_de_chaussee','n1','n2','n3','n4') NULL AFTER `nom`",
    "ALTER TABLE `biens` ADD COLUMN IF NOT EXISTS `nombre_pieces` INT NULL AFTER `etat`",
  ];

  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (error: any) {
      if (typeof error?.message === "string" && error.message.includes("Duplicate column name")) {
        continue;
      }
      console.error("[biens][ensureColumns]", { sql, error });
      throw error;
    }
  }

  biensColumnsEnsured = true;
}

