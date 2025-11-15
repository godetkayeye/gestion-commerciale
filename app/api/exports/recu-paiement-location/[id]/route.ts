import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import jsPDF from "jspdf";

const allowed = new Set(["ADMIN"]);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  // Gérer le cas où params peut être une Promise (Next.js 15+)
  const resolvedParams = params instanceof Promise ? await params : params;
  const id = Number(resolvedParams.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  const paiement = await prisma.paiements_location.findUnique({
    where: { id },
    include: {
      contrat: {
        include: {
          bien: true,
          locataire: true
        }
      }
    }
  });

  if (!paiement) {
    return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
  }

  // Générer le PDF
  const doc = new jsPDF();
  let yPos = 20;

  // En-tête
  doc.setFontSize(20);
  doc.text('REÇU DE PAIEMENT', 105, yPos, { align: 'center' });
  yPos += 10;
  doc.setFontSize(12);
  doc.text(`Reçu #${paiement.id}`, 105, yPos, { align: 'center' });
  yPos += 15;

  // Informations du paiement
  doc.setFontSize(14);
  doc.text('INFORMATIONS DU PAIEMENT', 20, yPos);
  doc.setDrawColor(0, 0, 0);
  doc.line(20, yPos + 2, 190, yPos + 2);
  yPos += 10;
  doc.setFontSize(11);
  doc.text(`Date de paiement: ${paiement.date_paiement ? new Date(paiement.date_paiement).toLocaleDateString('fr-FR') : 'N/A'}`, 20, yPos);
  yPos += 7;
  doc.text(`Montant: ${Number(paiement.montant).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC`, 20, yPos);
  yPos += 7;
  if (Number(paiement.penalite) > 0) {
    doc.text(`Pénalité: ${Number(paiement.penalite).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC`, 20, yPos);
    yPos += 7;
  }
  if (Number(paiement.reste_du) > 0) {
    doc.text(`Reste dû: ${Number(paiement.reste_du).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FC`, 20, yPos);
    yPos += 7;
  } else {
    doc.text(`Reste dû: Payé intégralement`, 20, yPos);
    yPos += 7;
  }
  yPos += 10;

  // Informations du bien
  doc.setFontSize(14);
  doc.text('BIEN', 20, yPos);
  doc.line(20, yPos + 2, 190, yPos + 2);
  yPos += 10;
  doc.setFontSize(11);
  doc.text(`Adresse: ${paiement.contrat?.bien?.adresse || "N/A"}`, 20, yPos);
  yPos += 7;
  doc.text(`Type: ${paiement.contrat?.bien?.type || "N/A"}`, 20, yPos);
  yPos += 7;
  doc.text(`Prix mensuel: ${paiement.contrat?.bien?.prix_mensuel ? Number(paiement.contrat.bien.prix_mensuel).toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : "N/A"} FC`, 20, yPos);
  yPos += 15;

  // Informations du locataire
  doc.setFontSize(14);
  doc.text('LOCATAIRE', 20, yPos);
  doc.line(20, yPos + 2, 190, yPos + 2);
  yPos += 10;
  doc.setFontSize(11);
  doc.text(`Nom: ${paiement.contrat?.locataire?.nom || "N/A"}`, 20, yPos);
  yPos += 7;
  doc.text(`Contact: ${paiement.contrat?.locataire?.contact || "N/A"}`, 20, yPos);
  yPos += 15;

  // Informations du contrat
  if (paiement.contrat) {
    doc.setFontSize(14);
    doc.text('CONTRAT', 20, yPos);
    doc.line(20, yPos + 2, 190, yPos + 2);
    yPos += 10;
    doc.setFontSize(11);
    doc.text(`Contrat #${paiement.contrat.id}`, 20, yPos);
    yPos += 7;
    doc.text(`Période: ${new Date(paiement.contrat.date_debut).toLocaleDateString('fr-FR')} - ${new Date(paiement.contrat.date_fin).toLocaleDateString('fr-FR')}`, 20, yPos);
    yPos += 10;
  }

  doc.setFontSize(10);
  doc.text(`Reçu généré le ${new Date().toLocaleDateString('fr-FR')}`, 105, yPos, { align: 'center' });

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="recu-paiement-${id}.pdf"`
    }
  });
}

