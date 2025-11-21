import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const allowed = new Set(["ADMIN", "LOCATION", "MANAGER_MULTI"]);

let pieceIdentiteColumnEnsured = false;

async function ensurePieceIdentiteColumnSize() {
  if (pieceIdentiteColumnEnsured) return;

  try {
    // Vérifier et modifier la colonne si nécessaire
    await prisma.$executeRawUnsafe(
      "ALTER TABLE `locataires` MODIFY `piece_identite` VARCHAR(255) DEFAULT NULL"
    );
    pieceIdentiteColumnEnsured = true;
  } catch (error: any) {
    // Ignorer les erreurs "Duplicate column" ou si la colonne est déjà correcte
    if (
      typeof error?.message === "string" &&
      (error.message.includes("Duplicate column name") ||
        error.message.includes("doesn't exist") ||
        error.message.includes("already exists"))
    ) {
      pieceIdentiteColumnEnsured = true;
      return;
    }
    console.error("[ensurePieceIdentiteColumnSize]", error);
    // Ne pas bloquer si la colonne existe déjà avec la bonne taille
    pieceIdentiteColumnEnsured = true;
  }
}

const LocataireSchema = z.object({
  nom: z.string().min(1),
  contact: z.string().optional().nullable(),
  profession: z.string().optional().nullable(),
  piece_identite: z.string().optional().nullable(),
});

export async function GET() {
  const items = await prisma.locataires.findMany({ orderBy: { nom: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  try {
    await ensurePieceIdentiteColumnSize();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !allowed.has(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = LocataireSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const created = await prisma.locataires.create({ data: parsed.data });
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("[locataires/POST]", error);
    
    // Vérifier si l'erreur est liée à la taille de la colonne
    if (error?.message?.includes("Data too long") || error?.message?.includes("value too long")) {
      return NextResponse.json(
        {
          error: "Le chemin de la pièce d'identité est trop long. Veuillez exécuter la migration SQL pour augmenter la taille de la colonne.",
          details: "ALTER TABLE `locataires` MODIFY `piece_identite` VARCHAR(255) DEFAULT NULL;",
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      {
        error: "Erreur lors de la création du locataire",
        details: error?.message || "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

