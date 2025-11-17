import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { convertDecimalToNumber } from "@/lib/convertDecimal";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "CAISSE_BAR", "BAR", "CAISSIER", "MANAGER_MULTI", "CONSEIL_ADMINISTRATION"]);

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const aujourdhui = searchParams.get("aujourdhui") === "true";

  const aujourdhuiDate = new Date();
  aujourdhuiDate.setHours(0, 0, 0, 0);
  const finAujourdhui = new Date(aujourdhuiDate);
  finAujourdhui.setHours(23, 59, 59, 999);

  const where: any = {};

  if (aujourdhui) {
    where.date_facture = {
      gte: aujourdhuiDate,
      lte: finAujourdhui,
    };
  }

  const factures = await prisma.factures.findMany({
    where,
    orderBy: { date_facture: "desc" },
    include: {
      commande: {
        include: {
          table: true,
          serveur: true,
        },
      },
    },
    take: 100,
  });

  return NextResponse.json(convertDecimalToNumber(factures));
}

