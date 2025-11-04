import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateVentesExcel } from "@/lib/exports";

export async function GET() {
  const ventes = await prisma.vente_pharmacie.findMany({ orderBy: { date_vente: "desc" }, take: 1000 });
  const buf = await generateVentesExcel(ventes);
  return new NextResponse(Buffer.from(buf), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": "attachment; filename=ventes.xlsx" } });
}


