import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import jsPDF from "jspdf";

const allowed = new Set(["ADMIN"]);

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  // Calculer les dates
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const debutMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1);
  const debutAnnee = new Date(aujourdhui.getFullYear(), 0, 1);

  // Récupérer les statistiques
  const [biensLibres, biensOccupes, biensMaintenance, totalBiens, loyersMois, loyersAnnee, loyersImpayesRaw, locatairesEnRetard] = await Promise.all([
    prisma.biens.count({ where: { etat: "LIBRE" as any } }),
    prisma.biens.count({ where: { etat: "OCCUPE" as any } }),
    prisma.biens.count({ where: { etat: "MAINTENANCE" as any } }),
    prisma.biens.count(),
    prisma.paiements_location.aggregate({
      _sum: { montant: true },
      where: { date_paiement: { gte: debutMois } }
    }),
    prisma.paiements_location.aggregate({
      _sum: { montant: true },
      where: { date_paiement: { gte: debutAnnee } }
    }),
    prisma.paiements_location.aggregate({
      _sum: { reste_du: true }
    }),
    prisma.paiements_location.count({
      where: { penalite: { gt: 0 } }
    })
  ]);

  const tauxOccupation = totalBiens > 0 ? ((biensOccupes / totalBiens) * 100) : 0;
  const loyersMoisTotal = Number(loyersMois._sum.montant ?? 0);
  const loyersAnneeTotal = Number(loyersAnnee._sum.montant ?? 0);
  const loyersImpayes = Number(loyersImpayesRaw._sum.reste_du ?? 0);

  // Générer le PDF
  const doc = new jsPDF();
  let yPos = 20;

  // En-tête
  doc.setFontSize(20);
  doc.text('RAPPORT LOCATION', 105, yPos, { align: 'center' });
  yPos += 8;
  doc.setFontSize(12);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 105, yPos, { align: 'center' });
  yPos += 15;

  // Statistiques principales
  doc.setFontSize(16);
  doc.text('STATISTIQUES PRINCIPALES', 20, yPos);
  doc.setDrawColor(0, 0, 0);
  doc.line(20, yPos + 2, 190, yPos + 2);
  yPos += 10;
  doc.setFontSize(11);

  doc.text(`Taux d'occupation: ${tauxOccupation.toFixed(1)}%`, 20, yPos);
  yPos += 7;
  doc.text(`Biens libres: ${biensLibres}`, 20, yPos);
  yPos += 7;
  doc.text(`Biens occupés: ${biensOccupes}`, 20, yPos);
  yPos += 7;
  doc.text(`Biens en maintenance: ${biensMaintenance}`, 20, yPos);
  yPos += 7;
  doc.text(`Total biens: ${totalBiens}`, 20, yPos);
  yPos += 12;

  // Loyers
  doc.setFontSize(16);
  doc.text('LOYERS', 20, yPos);
  doc.line(20, yPos + 2, 190, yPos + 2);
  yPos += 10;
  doc.setFontSize(11);

  doc.text(`Loyers encaissés (mois): ${loyersMoisTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC`, 20, yPos);
  yPos += 7;
  doc.text(`Loyers encaissés (année): ${loyersAnneeTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC`, 20, yPos);
  yPos += 7;
  doc.text(`Loyers impayés: ${loyersImpayes.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC`, 20, yPos);
  yPos += 7;
  doc.text(`Locataires en retard: ${locatairesEnRetard}`, 20, yPos);
  yPos += 12;

  // Paiements par mois (6 derniers mois)
  doc.setFontSize(16);
  doc.text('ÉVOLUTION DES LOYERS (6 DERNIERS MOIS)', 20, yPos);
  doc.line(20, yPos + 2, 190, yPos + 2);
  yPos += 10;
  doc.setFontSize(11);

  for (let i = 5; i >= 0; i--) {
    const dateDebut = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth() - i, 1);
    const dateFin = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth() - i + 1, 0);
    dateFin.setHours(23, 59, 59, 999);

    const paiements = await prisma.paiements_location.aggregate({
      _sum: { montant: true },
      where: {
        date_paiement: {
          gte: dateDebut,
          lte: dateFin
        }
      }
    });

    const mois = dateDebut.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const montant = Number(paiements._sum.montant ?? 0);
    doc.text(`${mois}: ${montant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC`, 20, yPos);
    yPos += 7;

    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
  }

  // Répartition des biens par type
  yPos += 5;
  doc.setFontSize(16);
  doc.text('RÉPARTITION DES BIENS PAR TYPE', 20, yPos);
  doc.line(20, yPos + 2, 190, yPos + 2);
  yPos += 10;
  doc.setFontSize(11);

  const biensParType = await prisma.biens.groupBy({
    by: ['type'],
    _count: { id: true }
  });

  for (const b of biensParType) {
    const type = b.type?.replace('_', ' ') || 'Autre';
    doc.text(`${type}: ${b._count.id}`, 20, yPos);
    yPos += 7;

    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
  }

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="rapport-location-${new Date().toISOString().split('T')[0]}.pdf"`
    }
  });
}

