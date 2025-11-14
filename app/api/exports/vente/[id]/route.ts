import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildPharmacyReceiptPDF } from "@/lib/exports";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const id = Number(resolvedParams.id);
  const vente = await prisma.vente_pharmacie.findUnique({ where: { id } });
  if (!vente) return NextResponse.json({ error: "Vente introuvable" }, { status: 404 });
  const details = await prisma.details_vente_pharmacie.findMany({ where: { vente_id: id }, include: { medicament: true } });
  const pdf = await buildPharmacyReceiptPDF(vente, details);
  return new NextResponse(pdf, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="vente-${id}.pdf"` } });
}


