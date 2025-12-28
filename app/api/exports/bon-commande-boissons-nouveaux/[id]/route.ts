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

    // Récupérer le paramètre depuis_id_max depuis l'URL
    const url = new URL(_req.url);
    const depuisIdMax = url.searchParams.get("depuis_id_max");
    const idMax = depuisIdMax ? Number(depuisIdMax) : null;

    // Récupérer la commande restaurant
    const commande = await prisma.commande.findUnique({
      where: { id },
    });

    if (!commande) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    // Récupérer les boissons depuis commande_boissons_restaurant
    let boissons: any[] = [];
    try {
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
        
        commandesBar.forEach((cmdBar: any) => {
          if (cmdBar.details && Array.isArray(cmdBar.details)) {
            boissons.push(...cmdBar.details);
          }
        });
      }
    } catch (e: any) {
      console.error(`Erreur lors de la récupération des boissons pour commande ${id}:`, e);
    }

    // Filtrer les boissons : seulement celles avec ID > idMax (si fourni)
    let boissonsFiltrees = boissons;
    if (idMax !== null && !isNaN(idMax)) {
      boissonsFiltrees = boissons.filter((b: any) => b.id > idMax);
    }

    // Si aucune nouvelle boisson, retourner une erreur
    if (boissonsFiltrees.length === 0) {
      return NextResponse.json({ 
        error: "Aucune nouvelle boisson à imprimer. Utilisez le bon de commande complet si vous voulez imprimer toutes les boissons.",
        details: "Passez le paramètre depuis_id_max avec le dernier ID de boisson connu pour imprimer seulement les nouvelles boissons."
      }, { status: 400 });
    }

    // Générer le PDF du bon de commande boissons (seulement les nouvelles)
    const pdf = await buildBonCommandeBoissonsPDF(commande, boissonsFiltrees);

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="bon-commande-boissons-nouveaux-${id}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Erreur lors de la génération du bon de commande boissons (nouvelles):", error);
    return NextResponse.json(
      { error: error?.message || "Erreur serveur lors de la génération du bon de commande" },
      { status: 500 }
    );
  }
}
