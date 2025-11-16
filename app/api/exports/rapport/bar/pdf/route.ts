import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import jsPDF from "jspdf";

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
          status: 'VALIDEE',
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
        status: 'VALIDEE',
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

  // Générer le PDF avec jsPDF
  const doc = new jsPDF();
  let yPos = 20;

  // En-tête
  doc.setFontSize(20);
  doc.text('Rapport Bar / Terrasse', 105, yPos, { align: 'center' });
  yPos += 10;
  doc.setFontSize(12);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 105, yPos, { align: 'center' });
  yPos += 15;

  // Chiffre d'affaires
  doc.setFontSize(16);
  doc.text('Chiffre d\'affaires', 20, yPos);
  doc.setDrawColor(0, 0, 0);
  doc.line(20, yPos + 2, 190, yPos + 2);
  yPos += 10;
  doc.setFontSize(12);
  doc.text(`Jour: ${Number(caJour._sum.total ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC`, 20, yPos);
  yPos += 7;
  doc.text(`Semaine: ${Number(caSemaine._sum.total ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC`, 20, yPos);
  yPos += 7;
  doc.text(`Mois: ${Number(caMois._sum.total ?? 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC`, 20, yPos);
  yPos += 15;

  // Boissons les plus vendues
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  doc.setFontSize(16);
  doc.text('Boissons les plus vendues (Mois)', 20, yPos);
  doc.line(20, yPos + 2, 190, yPos + 2);
  yPos += 10;
  doc.setFontSize(10);
  doc.text('Rang', 20, yPos);
  doc.text('Boisson', 50, yPos);
  doc.text('Quantité', 120, yPos);
  doc.text('CA (FC)', 160, yPos);
  yPos += 5;
  doc.line(20, yPos, 190, yPos);
  yPos += 7;

  boissonsVenduesRaw.slice(0, 10).forEach((bv, idx) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    const boisson = boissons.find(b => b.id === bv.boisson_id);
    doc.text(`${idx + 1}`, 20, yPos);
    doc.text(boisson?.nom || "Inconnu", 50, yPos);
    doc.text(String(bv._sum.quantite || 0), 120, yPos);
    doc.text(Number(bv._sum.prix_total || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 }), 160, yPos);
    yPos += 7;
  });

  yPos += 10;

  // Serveurs les plus performants
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }
  doc.setFontSize(16);
  doc.text('Serveurs les plus performants (Mois)', 20, yPos);
  doc.line(20, yPos + 2, 190, yPos + 2);
  yPos += 10;
  doc.setFontSize(10);
  doc.text('Rang', 20, yPos);
  doc.text('Serveur', 50, yPos);
  doc.text('Commandes', 120, yPos);
  doc.text('CA (FC)', 160, yPos);
  yPos += 5;
  doc.line(20, yPos, 190, yPos);
  yPos += 7;

  serveursPerformants.forEach((s, idx) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    doc.text(`${idx + 1}`, 20, yPos);
    doc.text(s.nom, 50, yPos);
    doc.text(String(s.commandes), 120, yPos);
    doc.text(s.ca.toLocaleString('fr-FR', { minimumFractionDigits: 2 }), 160, yPos);
    yPos += 7;
  });

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="rapport-bar-${new Date().toISOString().split('T')[0]}.pdf"`
    }
  });
}

