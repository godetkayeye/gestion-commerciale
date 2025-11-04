import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDateRanges } from "@/lib/utils";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const { daily, weekly, monthly } = getDateRanges(new Date(date));

    // Récupérer les ventes de la période
    const ventes = await prisma.vente_pharmacie.findMany({
      where: {
        date_vente: {
          gte: daily.start,
          lte: daily.end,
        },
      },
      include: {
        details: {
          include: {
            medicament: true,
          },
        },
      },
      orderBy: {
        date_vente: "asc",
      },
    });

    // Préparer les données pour l'export
    const data = ventes.flatMap((vente) =>
      vente.details.map((detail) => ({
        "Date": vente.date_vente ? new Date(vente.date_vente).toLocaleString() : "",
        "N° Vente": vente.id,
        "Produit": detail.medicament?.nom || "",
        "Quantité": detail.quantite,
        "Prix unitaire": detail.medicament?.prix_unitaire || 0,
        "Total": detail.prix_total || 0,
      }))
    );

    // Créer un workbook Excel
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ventes");

    // Générer le buffer
    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Définir le nom du fichier
    const fileName = `rapport-ventes-${new Date().toISOString().split("T")[0]}.xlsx`;

    // Retourner le fichier
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Error generating Excel report:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du rapport Excel" },
      { status: 500 }
    );
  }
}