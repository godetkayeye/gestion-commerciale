import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateVentePdfTicket } from "@/lib/exports";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const vente = await prisma.vente_pharmacie.findUnique({ where: { id } });
  if (!vente) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  const details = await prisma.details_vente_pharmacie.findMany({ where: { vente_id: id }, include: { medicament: true } });
  const arr = await generateVentePdfTicket(vente, details);
  return new NextResponse(Buffer.from(arr), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="vente_${id}.pdf"` } });
}


