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
    // Normaliser la devise en majuscules pour correspondre à l'enum Prisma
    const deviseRaw = body?.devise || "FRANC";
    let devise: "FRANC" | "DOLLAR";
    if (typeof deviseRaw === "string") {
      const deviseUpper = deviseRaw.toUpperCase().trim();
      devise = deviseUpper === "DOLLAR" ? "DOLLAR" : "FRANC";
    } else {
      devise = "FRANC";
    }
    
    // Log pour debug
    console.log("[API] Devise reçue:", { raw: deviseRaw, normalized: devise });
    
    // Récupérer l'utilisateur (caissier) pour obtenir son ID (requête SQL brute pour éviter les erreurs d'enum)
    const caissier = session.user?.email
      ? await prisma.$queryRaw<Array<{ id: number; nom: string; email: string; role: string }>>`
          SELECT id, nom, email, role
          FROM utilisateur
          WHERE email = ${session.user.email}
          LIMIT 1
        `.then((users) => users && users.length > 0 ? users[0] : null)
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
    
    // Récupérer le taux de change depuis la base de données
    const { getTauxChange } = await import("@/lib/getTauxChange");
    const TAUX_CHANGE = await getTauxChange();
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
      // S'assurer que la devise est bien en majuscules avant de créer le paiement
      const deviseFinale: "FRANC" | "DOLLAR" = devise === "DOLLAR" ? "DOLLAR" : "FRANC";
      
      // Utiliser une requête SQL brute pour éviter les problèmes de transformation d'enum
      // MySQL stocke les enums comme des strings, donc on passe directement la valeur en majuscules
      await tx.$executeRaw`
        INSERT INTO paiement (module, reference_id, montant, mode_paiement, devise, caissier_id, date_paiement)
        VALUES ('restaurant', ${id}, ${montant}, 'cash', ${deviseFinale}, ${caissier?.id ?? null}, NOW())
      `;
      
      // Récupérer l'ID du paiement créé
      const lastIdResult = await tx.$queryRaw<Array<{ id: number }>>`
        SELECT LAST_INSERT_ID() as id
      `;
      const paiementId = lastIdResult[0]?.id || 0;
      
      const paiement = { id: paiementId };
      
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


