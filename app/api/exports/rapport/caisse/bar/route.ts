import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import jsPDF from "jspdf";
import ExcelJS from "exceljs";

const allowed = new Set(["ADMIN", "CAISSE_BAR", "MANAGER_MULTI"]);

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

  // Récupérer les factures
  const factures = await prisma.factures.findMany({
    where: {
      date_facture: {
        gte: dateDebut,
        lte: dateFin,
      },
    },
    orderBy: { date_facture: "asc" },
    include: {
      commande: {
        include: {
          table: true,
          serveur: true,
        },
      },
    },
  });

  const total = factures.reduce((acc, f) => acc + Number(f.total ?? 0), 0);

  if (format === "excel") {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Rapport Caisse Bar");
    
    ws.addRow(["Rapport Financier - Caisse Bar / Terrasse"]);
    ws.addRow([`Période: ${labelPeriode}`]);
    ws.addRow([`Date: ${new Date().toLocaleDateString("fr-FR")}`]);
    ws.addRow([`Total: ${total.toFixed(2)} FC`]);
    ws.addRow([`Nombre de factures: ${factures.length}`]);
    ws.addRow([]);
    
    ws.addRow(["ID", "Commande", "Table", "Total", "Taxes", "Date"]);
    
    factures.forEach((f) => {
      ws.addRow([
        f.id,
        f.commande_id || "-",
        f.commande?.table?.nom || "-",
        Number(f.total ?? 0),
        Number(f.taxes ?? 0),
        f.date_facture ? new Date(f.date_facture).toLocaleDateString("fr-FR") : "-",
      ]);
    });
    
    const buf = await wb.xlsx.writeBuffer();
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=rapport-caisse-bar-${periode}-${new Date().toISOString().split("T")[0]}.xlsx`,
      },
    });
  } else {
    // PDF
    const doc = new jsPDF();
    let y = 10;

    doc.setFontSize(16);
    doc.text("Rapport Financier - Caisse Bar / Terrasse", 10, y);
    y += 10;

    doc.setFontSize(12);
    doc.text(`Période: ${labelPeriode}`, 10, y);
    y += 7;
    doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, 10, y);
    y += 7;
    doc.text(`Total: ${total.toFixed(2)} FC`, 10, y);
    y += 7;
    doc.text(`Nombre de factures: ${factures.length}`, 10, y);
    y += 10;

    if (factures.length > 0) {
      doc.setFontSize(10);
      doc.text("Détails des factures:", 10, y);
      y += 7;

      factures.forEach((f, index) => {
        if (y > 280) {
          doc.addPage();
          y = 10;
        }
        doc.text(
          `${index + 1}. Facture #${f.id} - Commande #${f.commande_id || "N/A"} - Table ${f.commande?.table?.nom || "N/A"} - ${Number(f.total ?? 0).toFixed(2)} FC - ${f.date_facture ? new Date(f.date_facture).toLocaleDateString("fr-FR") : "N/A"}`,
          15,
          y
        );
        y += 5;
      });
    } else {
      doc.text("Aucune facture pour cette période", 10, y);
    }

    const pdfBytes = doc.output("arraybuffer");
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=rapport-caisse-bar-${periode}-${new Date().toISOString().split("T")[0]}.pdf`,
      },
    });
  }
}

