import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR"]);

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

