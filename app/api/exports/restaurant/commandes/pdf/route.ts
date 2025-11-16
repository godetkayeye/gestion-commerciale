import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsPDF } from "jspdf";

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

  const doc = new jsPDF();
  let y = 20;

  // Titre
  doc.setFontSize(18);
  doc.text("Liste des commandes - Restaurant", 14, y);
  y += 10;

  // En-têtes du tableau
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("ID", 14, y);
  doc.text("Table", 30, y);
  doc.text("Statut", 60, y);
  doc.text("Total", 100, y);
  doc.text("Date", 130, y);
  y += 7;

  // Lignes de données
  doc.setFont("helvetica", "normal");
  commandes.forEach((commande) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(String(commande.id), 14, y);
    doc.text(commande.table_numero || "-", 30, y);
    doc.text(commande.statut || "-", 60, y);
    doc.text(`${Number(commande.total ?? 0).toFixed(2)} FC`, 100, y);
    doc.text(
      commande.date_commande
        ? new Date(commande.date_commande).toLocaleDateString("fr-FR")
        : "-",
      130,
      y
    );
    y += 7;
  });

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=liste-commandes-restaurant.pdf"
    }
  });
}


