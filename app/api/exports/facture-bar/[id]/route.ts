import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jsPDF from "jspdf";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const id = Number(resolvedParams.id);
  let facture: any = await prisma.factures.findUnique({ where: { id } });
  let commande: any;
  
  if (facture) {
    commande = await prisma.commandes_bar.findUnique({
      where: { id: facture.commande_id! },
      include: { table: true, serveur: true, details: { include: { boisson: true } } },
    });
  } else {
    commande = await prisma.commandes_bar.findUnique({
      where: { id },
      include: { table: true, serveur: true, details: { include: { boisson: true } }, facture: true },
    });
    if (commande && commande.facture) facture = commande.facture;
  }
  
  if (!facture || !commande) return NextResponse.json({ error: "Facture ou commande introuvable" }, { status: 404 });

  const doc = new jsPDF();
  let y = 10;
  doc.setFontSize(16);
  doc.text("FACTURE — Bar / Terrasse", 10, y);
  y += 10;
  doc.setFontSize(10);
  doc.text(`Facture #${facture.id} | Commande #${commande.id}`, 10, y);
  y += 6;
  if (commande.table) doc.text(`Table: ${commande.table.nom}`, 10, y);
  y += 6;
  if (commande.serveur) doc.text(`Serveur: ${commande.serveur.nom}`, 10, y);
  y += 6;
  doc.text(`Date: ${new Date(facture.date_facture ?? Date.now()).toLocaleString("fr-FR")}`, 10, y);
  y += 10;
  doc.text("Articles:", 10, y);
  y += 6;
  commande.details.forEach((d: any) => {
    doc.text(`- ${d.boisson?.nom ?? "N/A"} x${d.quantite} = ${Number(d.prix_total).toFixed(2)} FC`, 12, y);
    y += 6;
  });
  y += 4;
  const sousTotal = Number(facture.total) - Number(facture.taxes);
  doc.text(`Sous-total: ${sousTotal.toFixed(2)} FC`, 10, y);
  y += 6;
  doc.text(`Taxes (18%): ${Number(facture.taxes).toFixed(2)} FC`, 10, y);
  y += 6;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL: ${Number(facture.total).toFixed(2)} FC`, 10, y);
  const pdf = doc.output("arraybuffer");
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="facture-${id}.pdf"`,
    },
  });
}

