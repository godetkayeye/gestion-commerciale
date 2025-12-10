import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ExcelJS from "exceljs";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR", "BAR", "MANAGER_MULTI"]);

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  // Calculer les dates
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const semainePassee = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const debutMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1);

  // Récupérer les données
  const [caJour, caSemaine, caMois, boissonsVenduesRaw, serveursPerformantsRaw] = await Promise.all([
    prisma.factures.aggregate({
      _sum: { total: true },
      where: { date_facture: { gte: aujourdhui } }
    }),
    prisma.factures.aggregate({
      _sum: { total: true },
      where: { date_facture: { gte: semainePassee } }
    }),
    prisma.factures.aggregate({
      _sum: { total: true },
      where: { date_facture: { gte: debutMois } }
    }),
    prisma.commande_details.groupBy({
      by: ['boisson_id'],
      where: {
        commande: {
          status: 'VALIDEE' as any,
          date_commande: { gte: debutMois }
        }
      },
      _sum: {
        quantite: true,
        prix_total: true
      },
      orderBy: {
        _sum: {
          quantite: 'desc'
        }
      },
      take: 10
    }),
    prisma.commandes_bar.findMany({
      where: {
        status: 'VALIDEE' as any,
        date_commande: { gte: debutMois },
        serveur_id: { not: null }
      },
      include: {
        serveur: true,
        details: true
      }
    })
  ]);

  // Traiter les boissons
  const boissonIds = boissonsVenduesRaw.map(b => b.boisson_id).filter((id): id is number => id !== null);
  const boissons = await prisma.boissons.findMany({
    where: { id: { in: boissonIds } }
  });

  // Traiter les serveurs
  const serveursMap = new Map<number, { nom: string; commandes: number; ca: number }>();
  for (const cmd of serveursPerformantsRaw) {
    if (!cmd.serveur_id || !cmd.serveur) continue;
    const existing = serveursMap.get(cmd.serveur_id) || { nom: cmd.serveur.nom, commandes: 0, ca: 0 };
    existing.commandes++;
    existing.ca += cmd.details.reduce((sum, d) => sum + Number(d.prix_total), 0);
    serveursMap.set(cmd.serveur_id, existing);
  }

  const serveursPerformants = Array.from(serveursMap.values())
    .sort((a, b) => b.ca - a.ca)
    .slice(0, 10);

  // Créer le workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Rapport Bar/Terrasse');

  // Style pour les en-têtes
  const headerStyle = {
    font: { bold: true, color: { argb: 'FFFFFFFF' } },
    fill: {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: 'FF2563EB' }
    },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
    border: {
      top: { style: 'thin' as const },
      left: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      right: { style: 'thin' as const }
    }
  };

  // Titre
  worksheet.mergeCells('A1:D1');
  worksheet.getCell('A1').value = 'Rapport Bar / Terrasse';
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };
  worksheet.getRow(1).height = 25;

  worksheet.getCell('A2').value = `Généré le ${new Date().toLocaleDateString('fr-FR')}`;
  worksheet.getCell('A2').font = { size: 10, italic: true };
  worksheet.getRow(3).height = 10;

  // Chiffre d'affaires
  let row = 4;
  worksheet.getCell(`A${row}`).value = 'Chiffre d\'affaires';
  worksheet.getCell(`A${row}`).font = { size: 14, bold: true };
  row++;

  worksheet.getCell(`A${row}`).value = 'Jour:';
  worksheet.getCell(`B${row}`).value = Number(caJour._sum.total ?? 0);
  worksheet.getCell(`B${row}`).numFmt = '#,##0.00 "FC"';
  row++;

  worksheet.getCell(`A${row}`).value = 'Semaine:';
  worksheet.getCell(`B${row}`).value = Number(caSemaine._sum.total ?? 0);
  worksheet.getCell(`B${row}`).numFmt = '#,##0.00 "FC"';
  row++;

  worksheet.getCell(`A${row}`).value = 'Mois:';
  worksheet.getCell(`B${row}`).value = Number(caMois._sum.total ?? 0);
  worksheet.getCell(`B${row}`).numFmt = '#,##0.00 "FC"';
  row += 2;

  // Boissons les plus vendues
  worksheet.getCell(`A${row}`).value = 'Boissons les plus vendues (Mois)';
  worksheet.getCell(`A${row}`).font = { size: 14, bold: true };
  row++;

  worksheet.getRow(row).values = ['Rang', 'Boisson', 'Quantité', 'CA (FC)'];
  worksheet.getRow(row).eachCell((cell) => {
    cell.style = headerStyle;
  });
  row++;

  boissonsVenduesRaw.slice(0, 10).forEach((bv, idx) => {
    const boisson = boissons.find(b => b.id === bv.boisson_id);
    worksheet.getRow(row).values = [
      idx + 1,
      boisson?.nom || "Inconnu",
      bv._sum.quantite || 0,
      Number(bv._sum.prix_total || 0)
    ];
    worksheet.getCell(`D${row}`).numFmt = '#,##0.00 "FC"';
    row++;
  });

  row += 2;

  // Serveurs les plus performants
  worksheet.getCell(`A${row}`).value = 'Serveurs les plus performants (Mois)';
  worksheet.getCell(`A${row}`).font = { size: 14, bold: true };
  row++;

  worksheet.getRow(row).values = ['Rang', 'Serveur', 'Commandes', 'CA (FC)'];
  worksheet.getRow(row).eachCell((cell) => {
    cell.style = headerStyle;
  });
  row++;

  serveursPerformants.forEach((s, idx) => {
    worksheet.getRow(row).values = [
      idx + 1,
      s.nom,
      s.commandes,
      s.ca
    ];
    worksheet.getCell(`D${row}`).numFmt = '#,##0.00 "FC"';
    row++;
  });

  // Ajuster la largeur des colonnes
  worksheet.columns.forEach((column) => {
    column.width = 20;
  });

  // Générer le buffer
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="rapport-bar-${new Date().toISOString().split('T')[0]}.xlsx"`
    }
  });
}

