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

    // Récupérer les paramètres depuis l'URL
    const url = new URL(_req.url);
    const depuisIdMax = url.searchParams.get("depuis_id_max");
    const exclureIdsStr = url.searchParams.get("exclure_ids");
    
    const idMax = depuisIdMax ? Number(depuisIdMax) : null;
    // Parse exclure_ids : peut être une string JSON ou une string de nombres séparés par des virgules
    let idsAExclure: number[] = [];
    if (exclureIdsStr) {
      try {
        // Essayer de parser comme JSON d'abord
        idsAExclure = JSON.parse(exclureIdsStr).map((id: any) => Number(id)).filter((id: number) => !isNaN(id));
      } catch {
        // Si pas du JSON valide, essayer comme string séparée par des virgules
        idsAExclure = exclureIdsStr.split(',').map(id => Number(id.trim())).filter((id: number) => !isNaN(id));
      }
    }

    // Récupérer la commande restaurant
    const commande = await prisma.commande.findUnique({
      where: { id },
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

    console.log(`[bon-commande-boissons-nouveaux] Commande ${id}:`);
    console.log(`  - Boissons trouvées: ${boissons.length}`, boissons.map((b: any) => ({ id: b.id, boisson_id: b.boisson_id, nom: b.boisson?.nom })));
    console.log(`  - idsAExclure: ${JSON.stringify(idsAExclure)}`);
    console.log(`  - idMax: ${idMax}`);

    // Filtrer les boissons : exclure celles qui existaient avant la modification
    let boissonsFiltrees = boissons;
    
    if (idsAExclure.length > 0) {
      // Méthode préférée : exclure les IDs spécifiques
      console.log(`  - Avant filtrage: ${boissonsFiltrees.length} boissons`);
      boissonsFiltrees = boissonsFiltrees.filter((b: any) => !idsAExclure.includes(b.id));
      console.log(`  - Après filtrage (exclure IDs): ${boissonsFiltrees.length} boissons`);
      console.log(`  - Boissons filtrées:`, boissonsFiltrees.map((b: any) => ({ id: b.id, boisson_id: b.boisson_id, nom: b.boisson?.nom })));
    } else if (idMax !== null && !isNaN(idMax)) {
      // Méthode de fallback : utiliser l'ID max
      boissonsFiltrees = boissonsFiltrees.filter((b: any) => b.id > idMax);
    }

    // Si aucune nouvelle boisson, retourner une erreur
    if (boissonsFiltrees.length === 0) {
      return NextResponse.json({ 
        error: "Aucune nouvelle boisson à imprimer. Utilisez le bon de commande complet si vous voulez imprimer toutes les boissons.",
        details: "Passez le paramètre exclure_ids avec la liste des IDs de boissons existantes pour imprimer seulement les nouvelles boissons."
      }, { status: 400 });
    }

    // Générer le PDF du bon de commande boissons (seulement les nouvelles)
    const pdf = await buildBonCommandeBoissonsPDF(commande, boissonsFiltrees, serveur);

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
