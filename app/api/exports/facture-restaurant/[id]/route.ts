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

    // Récupérer le paiement associé avec une requête SQL brute pour éviter les problèmes avec l'enum Devise
    const paiementRawArray = await prisma.$queryRaw<Array<{
      id: number;
      module: string;
      reference_id: number;
      montant: any;
      mode_paiement: string;
      devise: string;
      caissier_id: number | null;
      date_paiement: Date | null;
    }>>`
      SELECT id, module, reference_id, montant, mode_paiement, 
             UPPER(devise) as devise, caissier_id, date_paiement
      FROM paiement
      WHERE module = 'restaurant' AND reference_id = ${id}
      ORDER BY date_paiement DESC
      LIMIT 1
    `;
    const paiementRaw = paiementRawArray && paiementRawArray.length > 0 ? paiementRawArray[0] : null;

    // Récupérer le caissier du paiement si disponible
    let paiement: any = null;
    if (paiementRaw) {
      const paiementAny = paiementRaw as any;
      paiement = {
        id: paiementRaw.id,
        module: paiementRaw.module,
        reference_id: paiementRaw.reference_id,
        montant: paiementRaw.montant,
        mode_paiement: paiementRaw.mode_paiement,
        devise: paiementAny.devise || paiementRaw.devise || "FRANC", // Inclure le champ devise
        date_paiement: paiementRaw.date_paiement,
      };
      
      // Accéder à caissier_id via any pour éviter les problèmes de type
      if (paiementAny.caissier_id) {
        try {
          paiement.caissier = await prisma.utilisateur.findUnique({
            where: { id: paiementAny.caissier_id },
            select: { id: true, nom: true, email: true },
          });
        } catch (e) {
          console.error("Erreur lors de la récupération du caissier du paiement:", e);
        }
      }
    }
    
    // Log pour debug
    console.log(`[FACTURE] Commande ${id} - Paiement trouvé:`, {
      paiementRaw: paiementRaw ? "OUI" : "NON",
      paiement: paiement ? "OUI" : "NON",
      statutCommande: (commande as any).statut,
    });

    // Récupérer le serveur et le caissier de la commande
    let serveur = null;
    let caissier = null;

    try {
      const commandeAny = commande as any;
      
      if (commandeAny.serveur_id) {
        const serveurData = await prisma.personnel.findUnique({
          where: { id: commandeAny.serveur_id },
          select: { id: true, nom: true },
        });
        serveur = serveurData ? { ...serveurData, email: "" } : null;
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

