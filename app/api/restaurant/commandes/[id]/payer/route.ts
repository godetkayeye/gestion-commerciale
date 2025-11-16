import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "CAISSE_RESTAURANT", "CAISSIER", "MANAGER_MULTI"]);

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !allowed.has(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
    
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = Number(resolvedParams.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }
    
    const commande = await prisma.commande.findUnique({ where: { id } });
    if (!commande) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }
    
    // Vérifier si la commande est déjà payée
    if (commande.statut === "PAYE" as any) {
      return NextResponse.json({ error: "Cette commande est déjà payée" }, { status: 400 });
    }
    
    const montant = Number(commande.total ?? 0);
    
    if (montant <= 0) {
      return NextResponse.json({ error: "Le montant de la commande est invalide" }, { status: 400 });
    }
    
    // Créer le paiement et mettre à jour le statut dans une transaction
    const result = await prisma.$transaction(async (tx) => {
      const paiement = await tx.paiement.create({
        data: {
          module: "RESTAURANT" as any,
          reference_id: id,
          montant,
          mode_paiement: "CASH" as any,
        },
      });
      
      await tx.commande.update({
        where: { id },
        data: { statut: "PAYE" as any },
      });
      
      return paiement;
    });
    
    return NextResponse.json({ ok: true, paiement_id: result.id }, { status: 200 });
  } catch (error: any) {
    console.error("Erreur lors du paiement:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur serveur lors du paiement" },
      { status: 500 }
    );
  }
}


