import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { convertDecimalToNumber } from "@/lib/convertDecimal";

const allowed = new Set(["ADMIN", "CAISSE_RESTAURANT", "CAISSIER", "MANAGER_MULTI", "CONSEIL_ADMINISTRATION"]);

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const aujourdhui = searchParams.get("aujourdhui") === "true";
  const referenceId = searchParams.get("reference_id");

  const aujourdhuiDate = new Date();
  aujourdhuiDate.setHours(0, 0, 0, 0);
  const finAujourdhui = new Date(aujourdhuiDate);
  finAujourdhui.setHours(23, 59, 59, 999);

  const where: any = {
    module: "RESTAURANT" as any,
  };

  if (referenceId) {
    where.reference_id = Number(referenceId);
  }

  if (aujourdhui) {
    where.date_paiement = {
      gte: aujourdhuiDate,
      lte: finAujourdhui,
    };
  }

  const paiements = await prisma.paiement.findMany({
    where,
    include: {
      caissier: {
        select: { id: true, nom: true, email: true },
      },
    },
    orderBy: { date_paiement: "desc" },
    take: 100,
  });

  return NextResponse.json(convertDecimalToNumber(paiements));
}

