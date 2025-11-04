import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const table = await prisma.table_restaurant.findUnique({ where: { id } });
  if (!table) return NextResponse.json({ error: "Table non trouvée" }, { status: 404 });
  const commandes = await prisma.commande.findMany({
    where: { table_numero: table.numero },
    orderBy: { date_commande: "desc" },
    include: { details: true },
  });
  return NextResponse.json({ table, commandes });
}
