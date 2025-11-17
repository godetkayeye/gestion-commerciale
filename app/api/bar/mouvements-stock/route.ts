import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { z } from "zod";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR", "BAR", "MANAGER_MULTI", "ECONOMAT", "SUPERVISEUR"]);

const MouvementSchema = z.object({
  boisson_id: z.number().int().positive(),
  type: z.enum(["ENTREE", "SORTIE"]),
  quantite: z.number().int().positive(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const boisson_id = searchParams.get("boisson_id");
  const mouvements = await prisma.mouvements_stock.findMany({
    where: boisson_id ? { boisson_id: Number(boisson_id) } : undefined,
    orderBy: { date_mouvement: "desc" },
    include: { boisson: true },
    take: 200,
  });
  return NextResponse.json(mouvements);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = MouvementSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    // Vérifier que la boisson existe
    const boisson = await prisma.boissons.findUnique({
      where: { id: parsed.data.boisson_id },
    });

    if (!boisson) {
      return NextResponse.json({ error: "Boisson introuvable" }, { status: 404 });
    }

    // Pour les sorties, vérifier le stock disponible
    if (parsed.data.type === "SORTIE") {
      if (Number(boisson.stock) < parsed.data.quantite) {
        return NextResponse.json(
          { error: `Stock insuffisant. Stock disponible: ${boisson.stock} ${boisson.unite_mesure}` },
          { status: 400 }
        );
      }
    }

    // Créer le mouvement et mettre à jour le stock dans une transaction
    const result = await prisma.$transaction(async (tx) => {
      // Créer le mouvement
      const mouvement = await tx.mouvements_stock.create({
        data: {
          boisson_id: parsed.data.boisson_id,
          type: parsed.data.type as any,
          quantite: parsed.data.quantite,
        },
        include: { boisson: true },
      });

      // Mettre à jour le stock
      if (parsed.data.type === "ENTREE") {
        await tx.boissons.update({
          where: { id: parsed.data.boisson_id },
          data: { stock: { increment: parsed.data.quantite } },
        });
      } else {
        await tx.boissons.update({
          where: { id: parsed.data.boisson_id },
          data: { stock: { decrement: parsed.data.quantite } },
        });
      }

      return mouvement;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("[bar/mouvements-stock/POST]", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error.message },
      { status: 500 }
    );
  }
}

