import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { convertDecimalToNumber } from "@/lib/convertDecimal";

const allowedGet = new Set(["ADMIN", "CAISSE_RESTAURANT", "CAISSIER", "MANAGER_MULTI", "SUPERVISEUR", "CONSEIL_ADMINISTRATION"]);
const allowedPut = new Set(["ADMIN", "CAISSE_RESTAURANT", "CAISSIER", "MANAGER_MULTI", "SUPERVISEUR"]);
const allowedDelete = new Set(["ADMIN", "CAISSE_RESTAURANT", "CAISSIER", "MANAGER_MULTI", "SUPERVISEUR"]);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !allowedGet.has(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const id = Number(resolvedParams.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    // Récupérer la commande avec les détails
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
      
      console.log(`[API] Boissons trouvées pour commande ${id}:`, boissons.length, boissons);
    } catch (e: any) {
      console.error(`[API] Erreur lors de la récupération des boissons pour commande ${id}:`, {
        message: e?.message,
        code: e?.code,
        error: e
      });
    }

    // Récupérer les informations du serveur, utilisateur et caissier si les colonnes existent
    let serveur = null;
    let utilisateur = null;
    let caissier = null;
    
    try {
      // Vérifier si les colonnes existent en accédant à la propriété
      const commandeAny = commande as any;
      if (commandeAny.serveur_id) {
        serveur = await prisma.utilisateur.findUnique({
          where: { id: commandeAny.serveur_id },
          select: { id: true, nom: true, email: true },
        });
      }
      if (commandeAny.utilisateur_id) {
        utilisateur = await prisma.utilisateur.findUnique({
          where: { id: commandeAny.utilisateur_id },
          select: { id: true, nom: true, email: true },
        });
      }
      if (commandeAny.caissier_id) {
        caissier = await prisma.utilisateur.findUnique({
          where: { id: commandeAny.caissier_id },
          select: { id: true, nom: true, email: true },
        });
      }
    } catch (e) {
      // Les colonnes n'existent peut-être pas encore
      console.log("Colonnes serveur_id/utilisateur_id/caissier_id non disponibles:", e);
    }

    // Ajouter les informations du serveur, utilisateur, caissier et boissons à la réponse
    const commandeWithRelations = {
      ...commande,
      serveur,
      utilisateur,
      caissier,
      boissons: boissons || [], // S'assurer que boissons est toujours un tableau
    };

    console.log(`[API] Commande ${id} - Plats: ${commande.details?.length || 0}, Boissons: ${boissons?.length || 0}`);
    console.log(`[API] Commande ${id} - Données complètes:`, {
      id: commandeWithRelations.id,
      total: commandeWithRelations.total,
      detailsCount: commandeWithRelations.details?.length || 0,
      boissonsCount: commandeWithRelations.boissons?.length || 0,
      boissons: commandeWithRelations.boissons
    });

    return NextResponse.json(convertDecimalToNumber(commandeWithRelations));
  } catch (error: any) {
    console.error("Erreur GET commande:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur serveur lors de la récupération de la commande" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !allowedPut.has(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const id = Number(resolvedParams.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const statut = body?.statut as string | undefined;

    if (!statut) {
      return NextResponse.json({ error: "statut requis" }, { status: 400 });
    }

    // Mettre à jour la commande restaurant et les commandes bar liées dans une transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mettre à jour la commande restaurant
      const updated = await tx.commande.update({
        where: { id },
        data: { statut: statut as any },
        include: {
          details: {
            include: {
              repas: true,
            },
          },
        },
      });

      // 2. Mettre à jour le statut des commandes bar liées
      // Mapper le statut de la commande restaurant au statut des commandes bar
      // Les commandes bar ont seulement EN_COURS et VALIDEE
      let statutBar: string;
      switch (statut) {
        case "EN_ATTENTE":
        case "EN_PREPARATION":
          statutBar = "EN_COURS";
          break;
        case "SERVI":
        case "PAYE":
          statutBar = "VALIDEE";
          break;
        default:
          statutBar = "EN_COURS";
      }

      try {
        await tx.commandes_bar.updateMany({
          where: { commande_restaurant_id: id } as any,
          data: { status: statutBar as any },
        });
      } catch (e) {
        console.log("Erreur lors de la mise à jour des commandes bar:", e);
        // Continuer même si la mise à jour des commandes bar échoue
      }

      // 3. Récupérer les boissons mises à jour
      let boissons: any[] = [];
      try {
        const commandesBar = await tx.commandes_bar.findMany({
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
      } catch (e) {
        console.log("Erreur lors de la récupération des boissons:", e);
      }

      // 4. Récupérer les informations du serveur, utilisateur et caissier
      let serveur = null;
      let utilisateur = null;
      let caissier = null;
      
      try {
        const commandeAny = updated as any;
        if (commandeAny.serveur_id) {
          serveur = await tx.utilisateur.findUnique({
            where: { id: commandeAny.serveur_id },
            select: { id: true, nom: true, email: true },
          });
        }
        if (commandeAny.utilisateur_id) {
          utilisateur = await tx.utilisateur.findUnique({
            where: { id: commandeAny.utilisateur_id },
            select: { id: true, nom: true, email: true },
          });
        }
        if (commandeAny.caissier_id) {
          caissier = await tx.utilisateur.findUnique({
            where: { id: commandeAny.caissier_id },
            select: { id: true, nom: true, email: true },
          });
        }
      } catch (e) {
        console.log("Erreur lors de la récupération du serveur/utilisateur/caissier:", e);
      }

      return {
        ...updated,
        serveur,
        utilisateur,
        caissier,
        boissons: boissons || [],
      };
    });

    return NextResponse.json(convertDecimalToNumber(result));
  } catch (error: any) {
    console.error("Erreur PUT commande:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur serveur lors de la mise à jour de la commande" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !allowedDelete.has(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // CAISSE_RESTAURANT n'a pas le droit d'annuler une commande
    if (session.user.role === "CAISSE_RESTAURANT") {
      return NextResponse.json({ error: "Vous n'avez pas le droit d'annuler une commande" }, { status: 403 });
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

    // Supprimer les détails d'abord
    await prisma.details_commande.deleteMany({ where: { commande_id: id } });
    // Puis supprimer la commande
    await prisma.commande.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erreur DELETE commande:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur serveur lors de la suppression de la commande" },
      { status: 500 }
    );
  }
}


