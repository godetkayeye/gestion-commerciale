import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildRestaurantOrderPDF } from "@/lib/exports";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const commande = await prisma.commande.findUnique({ where: { id } });
  if (!commande) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  const details = await prisma.details_commande.findMany({ where: { commande_id: id }, include: { repas: true } });
  const pdf = await buildRestaurantOrderPDF(commande, details);
  return new NextResponse(pdf, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="commande-${id}.pdf"` } });
}


