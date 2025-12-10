import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsPDF } from "jspdf";

export async function GET() {
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const semainePassee = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const debutMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1);

  const [recettesJour, recettesSemaine, recettesMois] = await Promise.all([
    prisma.paiement.aggregate({
      _sum: { montant: true },
      where: { module: "RESTAURANT" as any, date_paiement: { gte: aujourdhui } }
    }),
    prisma.paiement.aggregate({
      _sum: { montant: true },
      where: { module: "RESTAURANT" as any, date_paiement: { gte: semainePassee } }
    }),
    prisma.paiement.aggregate({
      _sum: { montant: true },
      where: { module: "RESTAURANT" as any, date_paiement: { gte: debutMois } }
    }),
  ]);

  const doc = new jsPDF();
  let y = 20;

  // Titre
  doc.setFontSize(18);
  doc.text("Analyse des ventes - Restaurant", 14, y);
  y += 15;

  // Statistiques
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Statistiques de vente par période", 14, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Recettes (Aujourd'hui): ${Number(recettesJour._sum.montant ?? 0).toFixed(2)} FC`,
    14,
    y
  );
  y += 7;
  doc.text(
    `Recettes (Cette semaine): ${Number(recettesSemaine._sum.montant ?? 0).toFixed(2)} FC`,
    14,
    y
  );
  y += 7;
  doc.text(
    `Recettes (Ce mois): ${Number(recettesMois._sum.montant ?? 0).toFixed(2)} FC`,
    14,
    y
  );

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=analyse-ventes-restaurant.pdf"
    }
  });
}


