import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { convertDecimalToNumber } from "@/lib/convertDecimal";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR", "CAISSE_RESTAURANT", "CAISSIER", "MANAGER_MULTI"]);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
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

    return NextResponse.json(convertDecimalToNumber(commande));
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
    if (!session?.user?.role || !allowed.has(session.user.role)) {
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

    const updated = await prisma.commande.update({
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

    return NextResponse.json(convertDecimalToNumber(updated));
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
    if (!session?.user?.role || !allowed.has(session.user.role)) {
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


