import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR", "CAISSIER"]);

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const path = url.pathname;
  const id = path.split('/').pop();
  
  console.log("Route API appelée avec URL:", req.url);
  console.log("Path:", path);
  console.log("ID extrait:", id);
  
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    if (!id) {
      console.error("Aucun ID dans l'URL");
      return NextResponse.json({ error: "ID de commande manquant" }, { status: 400 });
    }

    const numericId = parseInt(id, 10);
    console.log("ID parsé:", numericId);
    
    if (isNaN(numericId)) {
      console.error("Impossible de convertir l'ID en nombre:", id);
      return NextResponse.json({ error: "ID de commande invalide" }, { status: 400 });
    }

    console.log("Recherche de la commande avec l'ID:", numericId);
    
    const commande = await prisma.commande.findUnique({
      where: { id: numericId },
      include: {
        details: {
          include: {
            repas: {
              select: {
                id: true,
                nom: true,
                prix: true,
                disponible: true
              }
            }
          }
        },
        utilisateur: {
          select: {
            id: true,
            nom: true,
            role: true
          }
        }
      }
    });

    console.log("Résultat de la requête:", commande);

    if (!commande) {
      return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 });
    }

    return NextResponse.json(commande);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Erreur lors de la récupération de la commande:", error);
    return NextResponse.json({ error: `Erreur serveur: ${errorMessage}` }, { status: 500 });
  }
}

export async function PUT(req: Request, ctx: { params?: { id?: string } }) {
  try {
    console.log("PUT route called, req.url:", req.url);

    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !allowed.has(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Extract id from URL to avoid params/Promise issues
    const url = new URL(req.url);
    const pathname = url.pathname;
    const rawId = pathname.split('/').pop();
    console.log("PUT extracted rawId:", rawId);

    const id = rawId ? parseInt(rawId, 10) : NaN;
    if (isNaN(id)) {
      console.error("PUT: ID de commande invalide:", rawId);
      return NextResponse.json({ error: "ID de commande invalide" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const newStatut = body?.statut as string | undefined;

    if (!newStatut) {
      return NextResponse.json({ error: "Statut requis" }, { status: 400 });
    }

    // Vérifier que le statut est valide
    const statutsValides = ["EN_ATTENTE", "EN_PREPARATION", "SERVI", "PAYE"];
    if (!statutsValides.includes(newStatut)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    // Vérifier la commande existante
    const commande = await prisma.commande.findUnique({
      where: { id },
      select: { statut: true }
    });

    if (!commande) {
      return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 });
    }

    // Vérifier la transition de statut
    const transitionsValides: Record<string, string[]> = {
      EN_ATTENTE: ["EN_PREPARATION"],
      EN_PREPARATION: ["SERVI"],
      SERVI: ["PAYE"],
      PAYE: []
    };

    if (!transitionsValides[commande.statut]?.includes(newStatut)) {
      return NextResponse.json({
        error: `Impossible de passer du statut ${commande.statut} à ${newStatut}`
      }, { status: 400 });
    }

    // Mettre à jour le statut
    const updated = await prisma.commande.update({
      where: { id },
      data: { statut: newStatut as any },
      include: {
        details: {
          include: {
            repas: {
              select: {
                id: true,
                nom: true,
                prix: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Erreur lors de la mise à jour du statut: ${errorMessage}` }, { status: 500 });
  }
}


