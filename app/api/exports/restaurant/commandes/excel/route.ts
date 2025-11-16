import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCommandesExcel } from "@/lib/exports";

export async function GET() {
  const commandes = await prisma.commande.findMany({
    orderBy: { date_commande: "desc" },
    include: {
      details: {
        include: {
          repas: true
        }
      }
    }
  });

  const buf = await generateCommandesExcel(commandes);
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=liste-commandes-restaurant.xlsx"
    }
  });
}


