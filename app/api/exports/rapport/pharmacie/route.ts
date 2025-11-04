import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildSalesReportExcelPharmacy } from "@/lib/exports";

export async function GET() {
  const ventes = await prisma.vente_pharmacie.findMany({ orderBy: { date_vente: "asc" } });
  const rows = ventes.map((v) => ({ date: v.date_vente ?? new Date(), total: Number(v.total ?? 0) }));
  const buf = await buildSalesReportExcelPharmacy(rows);
  return new NextResponse(buf, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": "attachment; filename=rapport-pharmacie.xlsx" } });
}


