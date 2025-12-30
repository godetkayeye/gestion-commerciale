import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildBonCommandePlatsPDF } from "@/lib/exports";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = Number(resolvedParams.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    // Récupérer la commande avec les détails des plats uniquement
    const commande = await prisma.commande.findUnique({
      where: { id },
      include: {
        details: {
          include: {
            repas: true,
          },
        },
      },
    });

    if (!commande) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    // Récupérer le serveur de la commande
    let serveur = null;
    try {
      const commandeAny = commande as any;
      if (commandeAny.serveur_id) {
        const serveurData = await prisma.personnel.findUnique({
          where: { id: commandeAny.serveur_id },
          select: { id: true, nom: true },
        });
        serveur = serveurData ? { ...serveurData, email: "" } : null;
      }
    } catch (e) {
      console.error("Erreur lors de la récupération du serveur:", e);
    }

    // Générer le PDF du bon de commande plats
    const pdf = await buildBonCommandePlatsPDF(commande, commande.details || [], serveur);

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="bon-commande-plats-${id}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Erreur lors de la génération du bon de commande plats:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur serveur lors de la génération du bon de commande" },
      { status: 500 }
    );
  }
}
