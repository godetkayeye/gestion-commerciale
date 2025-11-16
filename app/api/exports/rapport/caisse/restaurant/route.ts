import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { buildSalesReportExcelRestaurant } from "@/lib/exports";
import jsPDF from "jspdf";

const allowed = new Set(["ADMIN", "CAISSE_RESTAURANT", "MANAGER_MULTI"]);

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const periode = searchParams.get("periode") || "jour";
  const format = searchParams.get("format") || "excel";

  // Calculer les dates selon la période
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const finAujourdhui = new Date(aujourdhui);
  finAujourdhui.setHours(23, 59, 59, 999);

  let dateDebut: Date;
  let dateFin: Date;
  let labelPeriode: string;

  if (periode === "jour") {
    dateDebut = aujourdhui;
    dateFin = finAujourdhui;
    labelPeriode = "Aujourd'hui";
  } else if (periode === "semaine") {
    dateDebut = new Date(aujourdhui);
    dateDebut.setDate(aujourdhui.getDate() - aujourdhui.getDay()); // Dimanche
    dateDebut.setHours(0, 0, 0, 0);
    dateFin = new Date();
    labelPeriode = "Cette semaine";
  } else {
    // mois
    dateDebut = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1);
    dateFin = new Date();
    labelPeriode = "Ce mois";
  }

  // Récupérer les paiements
  const paiements = await prisma.paiement.findMany({
    where: {
      module: "RESTAURANT" as any,
      date_paiement: {
        gte: dateDebut,
        lte: dateFin,
      },
    },
    orderBy: { date_paiement: "asc" },
  });

  const total = paiements.reduce((acc, p) => acc + Number(p.montant ?? 0), 0);

  if (format === "excel") {
    const rows = paiements.map((p) => ({
      date: p.date_paiement ?? new Date(),
      montant: Number(p.montant ?? 0),
    }));
    const buf = await buildSalesReportExcelRestaurant(rows);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=rapport-caisse-restaurant-${periode}-${new Date().toISOString().split("T")[0]}.xlsx`,
      },
    });
  } else {
    // PDF
    const doc = new jsPDF();
    let y = 10;

    doc.setFontSize(16);
    doc.text("Rapport Financier - Caisse Restaurant", 10, y);
    y += 10;

    doc.setFontSize(12);
    doc.text(`Période: ${labelPeriode}`, 10, y);
    y += 7;
    doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, 10, y);
    y += 7;
    doc.text(`Total: ${total.toFixed(2)} FC`, 10, y);
    y += 7;
    doc.text(`Nombre de paiements: ${paiements.length}`, 10, y);
    y += 10;

    if (paiements.length > 0) {
      doc.setFontSize(10);
      doc.text("Détails des paiements:", 10, y);
      y += 7;

      paiements.forEach((p, index) => {
        if (y > 280) {
          doc.addPage();
          y = 10;
        }
        doc.text(
          `${index + 1}. Paiement #${p.id} - ${p.mode_paiement} - ${Number(p.montant ?? 0).toFixed(2)} FC - ${p.date_paiement ? new Date(p.date_paiement).toLocaleDateString("fr-FR") : "N/A"}`,
          15,
          y
        );
        y += 5;
      });
    } else {
      doc.text("Aucun paiement pour cette période", 10, y);
    }

    const pdfBytes = doc.output("arraybuffer");
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=rapport-caisse-restaurant-${periode}-${new Date().toISOString().split("T")[0]}.pdf`,
      },
    });
  }
}

