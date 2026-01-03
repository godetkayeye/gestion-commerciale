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

    // Récupérer la commande
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

    // Filtrer les détails : exclure ceux qui existaient avant la modification
    let detailsFiltres = commande.details || [];
    
    console.log(`[bon-commande-plats-nouveaux] Commande ${id}:`);
    console.log(`  - Détails trouvés: ${detailsFiltres.length}`, detailsFiltres.map((d: any) => ({ id: d.id, repas_id: d.repas_id, nom: d.repas?.nom })));
    console.log(`  - idsAExclure: ${JSON.stringify(idsAExclure)}`);
    console.log(`  - idMax: ${idMax}`);
    
    if (idsAExclure.length > 0) {
      // Méthode préférée : exclure les IDs spécifiques
      console.log(`  - Avant filtrage: ${detailsFiltres.length} détails`);
      detailsFiltres = detailsFiltres.filter((d: any) => !idsAExclure.includes(d.id));
      console.log(`  - Après filtrage (exclure IDs): ${detailsFiltres.length} détails`);
      console.log(`  - Détails filtrés:`, detailsFiltres.map((d: any) => ({ id: d.id, repas_id: d.repas_id, nom: d.repas?.nom })));
    } else if (idMax !== null && !isNaN(idMax)) {
      // Méthode de fallback : utiliser l'ID max
      detailsFiltres = detailsFiltres.filter((d: any) => d.id > idMax);
    }

    // Si aucun nouveau détail, retourner une erreur
    if (detailsFiltres.length === 0) {
      return NextResponse.json({ 
        error: "Aucun nouveau plat à imprimer. Utilisez le bon de commande complet si vous voulez imprimer tous les plats.",
        details: "Passez le paramètre depuis_id_max avec le dernier ID de détail connu pour imprimer seulement les nouveaux plats."
      }, { status: 400 });
    }

    // Générer le PDF du bon de commande plats (seulement les nouveaux)
    const pdf = await buildBonCommandePlatsPDF(commande, detailsFiltres, serveur);

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="bon-commande-plats-nouveaux-${id}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Erreur lors de la génération du bon de commande plats (nouveaux):", error);
    return NextResponse.json(
      { error: error?.message || "Erreur serveur lors de la génération du bon de commande" },
      { status: 500 }
    );
  }
}
