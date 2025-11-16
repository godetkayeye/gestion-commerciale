import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import jsPDF from "jspdf";
import ExcelJS from "exceljs";

const allowed = new Set(["ADMIN", "CAISSE_LOCATION", "MANAGER_MULTI"]);

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
  const paiements = await prisma.paiements_location.findMany({
    where: {
      date_paiement: {
        gte: dateDebut,
        lte: dateFin,
      },
    },
    include: {
      contrat: {
        include: {
          bien: true,
          locataire: true,
        },
      },
    },
    orderBy: { date_paiement: "asc" },
  });

  const total = paiements.reduce((acc, p) => acc + Number(p.montant ?? 0), 0);

  if (format === "excel") {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Rapport Location");
    
    // En-têtes
    ws.addRow(["Rapport Financier - Caisse Location"]);
    ws.addRow([`Période: ${labelPeriode}`]);
    ws.addRow([`Date: ${new Date().toLocaleDateString("fr-FR")}`]);
    ws.addRow([`Total: ${total.toFixed(2)} FC`]);
    ws.addRow([`Nombre de paiements: ${paiements.length}`]);
    ws.addRow([]);
    
    // En-têtes du tableau
    ws.addRow(["ID", "Date", "Contrat", "Bien", "Locataire", "Montant", "Reste dû", "Pénalité"]);
    
    // Données
    paiements.forEach((p) => {
      ws.addRow([
        p.id,
        p.date_paiement ? new Date(p.date_paiement).toLocaleDateString("fr-FR") : "",
        p.contrat_id,
        p.contrat?.bien?.adresse || "-",
        p.contrat?.locataire?.nom || "-",
        Number(p.montant ?? 0),
        Number(p.reste_du ?? 0),
        Number(p.penalite ?? 0),
      ]);
    });
    
    // Style des en-têtes
    ws.getRow(7).font = { bold: true };
    ws.columns.forEach((column) => {
      column.width = 15;
    });
    
    const buf = await wb.xlsx.writeBuffer();
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=rapport-caisse-location-${periode}-${new Date().toISOString().split("T")[0]}.xlsx`,
      },
    });
  } else {
    // PDF
    const doc = new jsPDF();
    let y = 10;

    doc.setFontSize(16);
    doc.text("Rapport Financier - Caisse Location", 10, y);
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
        const bien = p.contrat?.bien?.adresse || "-";
        const locataire = p.contrat?.locataire?.nom || "-";
        doc.text(
          `${index + 1}. Paiement #${p.id} - Contrat #${p.contrat_id} - ${bien} - ${locataire} - ${Number(p.montant ?? 0).toFixed(2)} FC`,
          15,
          y
        );
        y += 5;
        if (Number(p.reste_du ?? 0) > 0) {
          doc.text(`   Reste dû: ${Number(p.reste_du).toFixed(2)} FC`, 20, y);
          y += 5;
        }
        if (Number(p.penalite ?? 0) > 0) {
          doc.text(`   Pénalité: ${Number(p.penalite).toFixed(2)} FC`, 20, y);
          y += 5;
        }
        y += 2;
      });
    } else {
      doc.text("Aucun paiement pour cette période", 10, y);
    }

    const pdfBytes = doc.output("arraybuffer");
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=rapport-caisse-location-${periode}-${new Date().toISOString().split("T")[0]}.pdf`,
      },
    });
  }
}

