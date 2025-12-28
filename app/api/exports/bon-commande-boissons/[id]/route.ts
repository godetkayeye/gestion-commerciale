import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildBonCommandeBoissonsPDF } from "@/lib/exports";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = Number(resolvedParams.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    // Récupérer la commande restaurant
    const commande = await prisma.commande.findUnique({
      where: { id },
    });

    if (!commande) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    // Récupérer les boissons depuis commande_boissons_restaurant et/ou commandes_bar
    let boissons: any[] = [];
    try {
      // D'abord, essayer commande_boissons_restaurant (méthode préférée)
      const boissonsRestaurant = await prisma.commande_boissons_restaurant.findMany({
        where: { commande_id: id },
        include: {
          boisson: true,
        },
      });
      
      if (boissonsRestaurant && boissonsRestaurant.length > 0) {
        boissons = boissonsRestaurant;
      } else {
        // Si pas trouvé, chercher dans commandes_bar liées
        const commandesBar = await prisma.commandes_bar.findMany({
          where: { commande_restaurant_id: id } as any,
          include: {
            details: {
              include: {
                boisson: true,
              },
            },
          },
        });
        
        // Extraire toutes les boissons de toutes les commandes bar liées
        commandesBar.forEach((cmdBar: any) => {
          if (cmdBar.details && Array.isArray(cmdBar.details)) {
            boissons.push(...cmdBar.details);
          }
        });
      }
      
      console.log(`[BON COMMANDE BOISSONS] Boissons trouvées pour commande ${id}:`, boissons.length);
    } catch (e: any) {
      console.error(`Erreur lors de la récupération des boissons pour commande ${id}:`, e);
    }

    // Générer le PDF du bon de commande boissons
    const pdf = await buildBonCommandeBoissonsPDF(commande, boissons);

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="bon-commande-boissons-${id}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Erreur lors de la génération du bon de commande boissons:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur serveur lors de la génération du bon de commande" },
      { status: 500 }
    );
  }
}
