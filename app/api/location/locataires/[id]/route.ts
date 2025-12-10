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
    await prisma.$executeRawUnsafe(
      "ALTER TABLE `locataires` MODIFY `piece_identite` VARCHAR(255) DEFAULT NULL"
    );
    pieceIdentiteColumnEnsured = true;
  } catch (error: any) {
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
    pieceIdentiteColumnEnsured = true;
  }
}

const LocataireSchema = z.object({
  nom: z.string().min(1),
  contact: z.string().optional().nullable(),
  profession: z.string().optional().nullable(),
  piece_identite: z.string().optional().nullable(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    await ensurePieceIdentiteColumnSize();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !allowed.has(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
    // Gérer le cas où params peut être une Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = Number(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }
    const body = await req.json();
    const parsed = LocataireSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const updated = await prisma.locataires.update({
      where: { id },
      data: parsed.data as any,
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[locataires/PUT]", error);
    
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
        error: "Erreur lors de la mise à jour du locataire",
        details: error?.message || "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  // Gérer le cas où params peut être une Promise (Next.js 15+)
  const resolvedParams = params instanceof Promise ? await params : params;
  const id = Number(resolvedParams.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }
  // Vérifier si le locataire a des contrats
  const contrats = await prisma.contrats.count({ where: { locataire_id: id } });
  if (contrats > 0) {
    return NextResponse.json({ error: "Impossible de supprimer : ce locataire a des contrats associés" }, { status: 400 });
  }
  await prisma.locataires.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

