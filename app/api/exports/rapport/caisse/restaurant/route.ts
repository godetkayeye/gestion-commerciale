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

  // Récupérer les paiements avec plus de détails
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

  // Récupérer les détails des commandes pour chaque paiement
  const paiementsWithDetails = await Promise.all(
    paiements.map(async (paiement) => {
      if (!paiement.reference_id) {
        return { ...paiement, commandeDetails: null, totalCommande: 0, caissier: null };
      }

      // Récupérer le caissier
      let caissier = null;
      if (paiement.caissier_id) {
        try {
          caissier = await prisma.utilisateur.findUnique({
            where: { id: paiement.caissier_id },
            select: { id: true, nom: true, email: true },
          });
        } catch (e) {
          console.log("Erreur récupération caissier:", e);
        }
      }

      // Récupérer la commande avec détails
      try {
        const commande = await prisma.commande.findUnique({
          where: { id: paiement.reference_id },
          include: {
            details: {
              include: {
                repas: true,
              },
            },
          },
        });

        if (!commande) {
          return { ...paiement, commandeDetails: null, totalCommande: 0, caissier };
        }

        // Récupérer les boissons
        let boissons: any[] = [];
        let totalBoissons = 0;
        try {
          const commandesBar = await prisma.commandes_bar.findMany({
            where: { commande_restaurant_id: commande.id } as any,
            include: {
              details: {
                include: {
                  boisson: true,
                },
              },
            },
          });
          
          commandesBar.forEach((cmdBar: any) => {
            if (cmdBar.details && Array.isArray(cmdBar.details)) {
              boissons.push(...cmdBar.details);
              cmdBar.details.forEach((detail: any) => {
                totalBoissons += Number(detail.prix_total || 0);
              });
            }
          });
        } catch (e) {
          console.log("Erreur récupération boissons:", e);
        }

        // Calculer le total des plats
        let totalPlats = 0;
        if (commande.details && Array.isArray(commande.details)) {
          commande.details.forEach((detail: any) => {
            totalPlats += Number(detail.prix_total || 0);
          });
        }

        const totalCommande = totalPlats + totalBoissons;

        return {
          ...paiement,
          commandeDetails: {
            ...commande,
            boissons,
          },
          totalCommande,
          caissier,
        };
      } catch (e) {
        console.log("Erreur récupération commande:", e);
        return { ...paiement, commandeDetails: null, totalCommande: 0, caissier };
      }
    })
  );

  const total = paiements.reduce((acc, p) => acc + Number(p.montant ?? 0), 0);
  
  // Statistiques par mode de paiement
  const statsParMode: Record<string, { count: number; total: number }> = {};
  paiements.forEach((p) => {
    const mode = p.mode_paiement || "NON_SPECIFIE";
    if (!statsParMode[mode]) {
      statsParMode[mode] = { count: 0, total: 0 };
    }
    statsParMode[mode].count++;
    statsParMode[mode].total += Number(p.montant ?? 0);
  });

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
    // PDF (mise en page professionnelle)
    const doc = new jsPDF({ orientation: "landscape" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 12;
    let y = 15;

    const formatCurrency = (value: number) =>
      `${value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC`;
    const formatDateTime = (value: Date | null | undefined) =>
      value ? new Date(value).toLocaleString("fr-FR") : "N/D";

    // Header
    doc.setFillColor(34, 70, 168);
    doc.rect(0, 0, pageWidth, 20, "F");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("Rapport Financier — Caisse Restaurant", marginX, 13);

    doc.setFontSize(11);
    doc.text(`Période : ${labelPeriode}`, marginX, 18);
    doc.text(`Généré le : ${new Date().toLocaleString("fr-FR")}`, pageWidth - 75, 18);

    doc.setTextColor(40, 40, 40);
    y = 32;

    // Cartes synthèse
    const cardWidth = (pageWidth - marginX * 2 - 20) / 3;
    const cardHeight = 24;
    const cardData = [
      { title: "Total encaisser", value: formatCurrency(total), subtitle: `${paiements.length} paiements` },
      {
        title: "Moyenne par paiement",
        value: paiements.length ? formatCurrency(total / paiements.length) : "0 FC",
        subtitle: "Ticket moyen",
      },
      {
        title: "Modes de paiement",
        value: Object.keys(statsParMode).length.toString(),
        subtitle: "Répartition détaillée ci-dessous",
      },
    ];

    cardData.forEach((card, index) => {
      const x = marginX + index * (cardWidth + 10);
      doc.setFillColor(247, 248, 255);
      doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, "F");
      doc.setDrawColor(222, 226, 255);
      doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, "S");
      doc.setFontSize(10);
      doc.setTextColor(120, 128, 149);
      doc.text(card.title, x + 5, y + 8);
      doc.setFontSize(14);
      doc.setTextColor(28, 36, 52);
      doc.text(card.value, x + 5, y + 16);
      doc.setFontSize(9);
      doc.setTextColor(120, 128, 149);
      doc.text(card.subtitle, x + 5, y + 21);
    });

    y += cardHeight + 18;

    // Répartition par mode
    doc.setFontSize(12);
    doc.setTextColor(28, 36, 52);
    doc.text("Répartition par mode de paiement", marginX, y);
    y += 6;

    const modeLineHeight = 6;
    doc.setFontSize(10);
    Object.entries(statsParMode).forEach(([mode, stats]) => {
      const pourcentage = total ? ((stats.total / total) * 100).toFixed(1) : "0";
      doc.text(
        `${mode} • ${stats.count} paiement(s) • ${formatCurrency(stats.total)} (${pourcentage}%)`,
        marginX + 2,
        y
      );
      y += modeLineHeight;
    });

    if (Object.keys(statsParMode).length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(120, 128, 149);
      doc.text("Aucun paiement pour cette période", marginX + 2, y);
      y += modeLineHeight;
    }

    y += 6;

    // Tableau des paiements
    doc.setFontSize(12);
    doc.setTextColor(28, 36, 52);
    doc.text("Détails des paiements", marginX, y);
    y += 6;

    const columns = [
      { label: "#", width: 10 },
      { label: "Date", width: 36 },
      { label: "Commande", width: 30 },
      { label: "Caissier", width: 40 },
      { label: "Mode", width: 28 },
      { label: "Montant payé", width: 32 },
      { label: "Total commande", width: 35 },
    ];
    const headerHeight = 7;
    const rowHeight = 6;

    const renderTableHeader = () => {
      doc.setFillColor(240, 243, 255);
      doc.setDrawColor(221, 229, 255);
      let x = marginX;
      doc.setFontSize(10);
      doc.setTextColor(45, 55, 72);
      columns.forEach((col) => {
        doc.rect(x, y, col.width, headerHeight, "FD");
        doc.text(col.label, x + 1.5, y + 4.5);
        x += col.width;
      });
      y += headerHeight;
    };

    const tableBottomMargin = 15;
    renderTableHeader();

    if (paiementsWithDetails.length === 0) {
      doc.setFontSize(10);
      doc.setTextColor(120, 128, 149);
      doc.text("Aucun paiement enregistré pour cette période.", marginX, y + 5);
    } else {
      doc.setFontSize(9);
      doc.setTextColor(45, 55, 72);
      paiementsWithDetails.forEach((p, index) => {
        if (y + rowHeight > pageHeight - tableBottomMargin) {
          doc.addPage("landscape");
          y = 15;
          renderTableHeader();
        }

        let x = marginX;
        const rowValues = [
      `${index + 1}`,
          formatDateTime(p.date_paiement),
          p.reference_id ? `#${p.reference_id}` : "-",
          p.caissier?.nom || "-",
          p.mode_paiement || "N/D",
          formatCurrency(Number(p.montant ?? 0)),
          formatCurrency(Number(p.totalCommande ?? 0)),
        ];

        rowValues.forEach((value, idx) => {
          doc.text(value, x + 1.5, y + 4);
          x += columns[idx].width;
        });

        doc.setDrawColor(245, 247, 250);
        doc.line(marginX, y + rowHeight, marginX + columns.reduce((sum, col) => sum + col.width, 0), y + rowHeight);
        y += rowHeight;
      });
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

