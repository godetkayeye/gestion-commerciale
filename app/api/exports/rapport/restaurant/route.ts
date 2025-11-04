import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildSalesReportExcelRestaurant } from "@/lib/exports";

export async function GET() {
  const paiements = await prisma.paiement.findMany({ where: { module: "RESTAURANT" as any }, orderBy: { date_paiement: "asc" } });
  const rows = paiements.map((p) => ({ date: p.date_paiement ?? new Date(), montant: Number(p.montant ?? 0) }));
  const buf = await buildSalesReportExcelRestaurant(rows);
  return new NextResponse(buf, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": "attachment; filename=rapport-restaurant.xlsx" } });
}


