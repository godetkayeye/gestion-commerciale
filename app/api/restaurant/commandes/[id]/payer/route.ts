import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const allowed = new Set(["ADMIN", "CAISSE_RESTAURANT", "CAISSIER", "MANAGER_MULTI"]);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
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
    
    // Récupérer le body pour obtenir la devise
    const body = await req.json().catch(() => ({}));
    const devise = body?.devise || "FRANC"; // Par défaut FRANC
    
    // Récupérer l'utilisateur (caissier) pour obtenir son ID
    const caissier = session.user?.email
      ? await prisma.utilisateur.findUnique({ where: { email: session.user.email } })
      : null;
    
    // Récupérer la commande avec ses détails (plats)
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
    
    // Vérifier si la commande est déjà payée
    if (commande.statut === "PAYE" as any) {
      return NextResponse.json({ error: "Cette commande est déjà payée" }, { status: 400 });
    }
    
    // Calculer le total réel des plats depuis les détails
    let totalPlats = 0;
    if (commande.details && Array.isArray(commande.details)) {
      commande.details.forEach((detail: any) => {
        const prixTotal = Number(detail.prix_total || 0);
        totalPlats += prixTotal;
      });
    }
    
    // Récupérer les boissons depuis les commandes bar liées
    let totalBoissons = 0;
    try {
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
          cmdBar.details.forEach((detail: any) => {
            const prixTotal = Number(detail.prix_total || 0);
            totalBoissons += prixTotal;
          });
        }
      });
    } catch (e) {
      console.log("Erreur lors de la récupération des boissons pour le paiement:", e);
    }
    
    // Calculer le total combiné (plats + boissons)
    const totalCombined = totalPlats + totalBoissons;
    
    // Taux de change: 1 USD = 2200 FC
    const TAUX_CHANGE = 2200;
    const totalDollars = totalCombined / TAUX_CHANGE;
    
    // Utiliser le montant selon la devise
    const montant = devise === "DOLLAR" 
      ? totalDollars
      : totalCombined;
    
    if (montant <= 0 || isNaN(montant)) {
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
          devise: devise as any,
          caissier_id: caissier?.id ?? null,
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


