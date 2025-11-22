import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildRestaurantInvoicePDF } from "@/lib/exports";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = Number(resolvedParams.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    // Récupérer la commande avec les détails (plats uniquement)
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

    // Récupérer les boissons depuis les commandes bar liées
    let boissons: any[] = [];
    try {
      // Récupérer les commandes bar liées à cette commande restaurant
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
      
      console.log(`[FACTURE] Boissons trouvées pour commande ${id}:`, boissons.length, boissons);
    } catch (e: any) {
      console.error(`[FACTURE] Erreur lors de la récupération des boissons pour commande ${id}:`, {
        message: e?.message,
        code: e?.code,
        error: e
      });
    }

    // Récupérer le paiement associé
    const paiementRaw = await prisma.paiement.findFirst({
      where: {
        module: "RESTAURANT",
        reference_id: id,
      },
      orderBy: {
        date_paiement: "desc",
      },
    });

    // Récupérer le caissier du paiement si disponible
    let paiement: any = null;
    if (paiementRaw) {
      paiement = { ...paiementRaw };
      if (paiementRaw.caissier_id) {
        try {
          paiement.caissier = await prisma.utilisateur.findUnique({
            where: { id: paiementRaw.caissier_id },
            select: { id: true, nom: true, email: true },
          });
        } catch (e) {
          console.error("Erreur lors de la récupération du caissier du paiement:", e);
        }
      }
    }

    // Récupérer le serveur et le caissier de la commande
    let serveur = null;
    let caissier = null;

    try {
      const commandeAny = commande as any;
      
      if (commandeAny.serveur_id) {
        serveur = await prisma.utilisateur.findUnique({
          where: { id: commandeAny.serveur_id },
          select: { id: true, nom: true, email: true },
        });
      }

      // Utiliser le caissier du paiement si disponible, sinon celui de la commande
      if (paiement?.caissier) {
        caissier = paiement.caissier;
      } else if (commandeAny.caissier_id) {
        caissier = await prisma.utilisateur.findUnique({
          where: { id: commandeAny.caissier_id },
          select: { id: true, nom: true, email: true },
        });
      }
    } catch (e) {
      console.log("Erreur lors de la récupération du serveur/caissier:", e);
    }

    // Combiner les plats et boissons pour la facture
    const platsItems = (commande.details || []).map((d: any) => ({
      type: "plat" as const,
      nom: d.repas?.nom || `Repas #${d.repas_id}`,
      quantite: d.quantite || 0,
      prix_unitaire: Number(d.prix_unitaire || d.repas?.prix || 0),
      prix_total: Number(d.prix_total || 0),
    }));
    
    const boissonsItems = (boissons || []).map((b: any) => ({
      type: "boisson" as const,
      nom: b.boisson?.nom || `Boisson #${b.boisson_id}`,
      quantite: b.quantite || 0,
      prix_unitaire: Number(b.prix_unitaire || b.boisson?.prix_vente || 0),
      prix_total: Number(b.prix_total || 0),
    }));
    
    const allItems = [...platsItems, ...boissonsItems];
    
    console.log(`[FACTURE] Commande ${id} - Items pour facture:`, {
      platsCount: platsItems.length,
      boissonsCount: boissonsItems.length,
      totalItems: allItems.length,
      plats: platsItems,
      boissons: boissonsItems
    });

    // Générer le PDF de la facture
    const pdf = await buildRestaurantInvoicePDF(
      commande,
      allItems,
      paiement,
      serveur,
      caissier
    );

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="facture-${id}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Erreur lors de la génération de la facture:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur serveur lors de la génération de la facture" },
      { status: 500 }
    );
  }
}

