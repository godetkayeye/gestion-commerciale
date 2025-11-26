import jsPDF from "jspdf";
import ExcelJS from "exceljs";

export async function buildPharmacyReceiptPDF(vente: any, details: any[]) {
  const doc = new jsPDF();
  let y = 10;
  doc.setFontSize(14);
  doc.text("Reçu — Pharmacie", 10, y);
  y += 8;
  doc.setFontSize(10);
  doc.text(`Vente #${vente.id} | ${new Date(vente.date_vente ?? Date.now()).toLocaleString()}`, 10, y);
  y += 8;
  doc.text("Articles:", 10, y);
  y += 6;
  details.forEach((d) => {
    doc.text(`- ${d.medicament?.nom ?? d.medicament_id} x${d.quantite} = ${Number(d.prix_total).toFixed(2)}`, 12, y);
    y += 6;
  });
  y += 4;
  doc.text(`Total: ${Number(vente.total ?? 0).toFixed(2)}`, 10, y);
  return doc.output("arraybuffer");
}

export async function buildRestaurantOrderPDF(commande: any, details: any[]) {
  const doc = new jsPDF();
  let y = 10;
  doc.setFontSize(14);
  doc.text("Ticket — Restaurant", 10, y);
  y += 8;
  doc.setFontSize(10);
  doc.text(`Commande #${commande.id} | Table ${commande.table_numero} | ${new Date(commande.date_commande ?? Date.now()).toLocaleString()}`, 10, y);
  y += 8;
  doc.text("Plats:", 10, y);
  y += 6;
  details.forEach((d) => {
    doc.text(`- ${d.repas?.nom ?? d.repas_id} x${d.quantite} = ${Number(d.prix_total).toFixed(2)}`, 12, y);
    y += 6;
  });
  y += 4;
  doc.text(`Total: ${Number(commande.total ?? 0).toFixed(2)}`, 10, y);
  return doc.output("arraybuffer");
}

export async function buildSalesReportExcelPharmacy(rows: Array<{ date: Date; total: number }>) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Ventes Pharmacie");
  ws.addRow(["Date", "Total"]);
  rows.forEach((r) => ws.addRow([r.date, r.total]));
  ws.getColumn(1).numFmt = "dd/mm/yyyy hh:mm";
  const buf = await wb.xlsx.writeBuffer();
  return buf;
}

export async function buildSalesReportExcelRestaurant(rows: Array<{ date: Date; montant: number }>) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Recettes Restaurant");
  ws.addRow(["Date", "Montant"]);
  rows.forEach((r) => ws.addRow([r.date, r.montant]));
  ws.getColumn(1).numFmt = "dd/mm/yyyy hh:mm";
  const buf = await wb.xlsx.writeBuffer();
  return buf;
}


export async function generateVentePdfTicket(vente: any, details: any[]) {
  const doc = new jsPDF();
  let y = 10;
  doc.setFontSize(14);
  doc.text("Ticket Vente Pharmacie", 10, y); y += 8;
  doc.setFontSize(10);
  doc.text(`Vente #${vente.id} - ${vente.date_vente ? new Date(vente.date_vente).toLocaleString() : ""}`, 10, y); y += 6;
  doc.text("---------------------------------------", 10, y); y += 6;
  details.forEach((d) => {
    doc.text(`${d.medicament?.nom ?? d.medicament_id} x${d.quantite}  ${Number(d.prix_total).toFixed(2)}`, 10, y);
    y += 5;
  });
  y += 2;
  doc.text("---------------------------------------", 10, y); y += 6;
  doc.setFontSize(12);
  doc.text(`Total: ${Number(vente.total ?? 0).toFixed(2)}`, 10, y);
  return doc.output("arraybuffer");
}

export async function generateCommandePdfTicket(commande: any, details: any[]) {
  const doc = new jsPDF();
  let y = 10;
  doc.setFontSize(14);
  doc.text("Ticket Commande Restaurant", 10, y); y += 8;
  doc.setFontSize(10);
  doc.text(`Cmd #${commande.id} - Table ${commande.table_numero} - ${commande.statut}`, 10, y); y += 6;
  doc.text("---------------------------------------", 10, y); y += 6;
  details.forEach((d) => {
    doc.text(`${d.repas?.nom ?? d.repas_id} x${d.quantite}  ${Number(d.prix_total).toFixed(2)}`, 10, y);
    y += 5;
  });
  y += 2;
  doc.text("---------------------------------------", 10, y); y += 6;
  doc.setFontSize(12);
  doc.text(`Total: ${Number(commande.total ?? 0).toFixed(2)}`, 10, y);
  return doc.output("arraybuffer");
}

export async function buildRestaurantInvoicePDF(
  commande: any,
  items: any[], // items peut contenir des plats et des boissons
  paiement: any,
  serveur: any,
  caissier: any
) {
  // Format ticket 80mm (largeur standard des tickets)
  const doc = new jsPDF({ 
    orientation: "portrait",
    unit: "mm",
    format: [80, 297] // 80mm de largeur, hauteur A4 pour permettre le contenu
  });
  
  let y = 8;
  const pageWidth = 80;
  const margin = 5;
  const contentWidth = pageWidth - (margin * 2);

  // Configuration des polices
  const fontNormal = "helvetica";
  const fontBold = "helvetica";
  
  // En-tête de l'établissement
  doc.setFontSize(11);
  doc.setFont(fontBold, "bold");
  doc.text("FACTURE DE VENTE", pageWidth / 2, y, { align: "center" });
  y += 5;

  // Nom de l'établissement (à personnaliser)
  doc.setFontSize(10);
  doc.setFont(fontBold, "bold");
  doc.text("Vilakazi", pageWidth / 2, y, { align: "center" });
  y += 4;

  doc.setFontSize(7);
  doc.setFont(fontNormal, "normal");
  doc.text("AFRO - FOOD - KULTURE - EVENT", pageWidth / 2, y, { align: "center" });
  y += 3.5;
  doc.text("22, Tombalbay, Kinshasa / Gombe", pageWidth / 2, y, { align: "center" });
  y += 3.5;
  doc.text("+243 XXX XXX XXX / +243 XXX XXX XXX", pageWidth / 2, y, { align: "center" });
  y += 5;

  // Ligne de séparation
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // Numéro de facture
  doc.setFontSize(9); // Augmenté de 8 à 9
  doc.setFont(fontBold, "bold");
  doc.text(`N°: ${commande.id}`, margin, y);
  y += 4;

  // Client
  doc.setFont(fontNormal, "normal");
  doc.setFontSize(8.5); // Augmenté pour la lisibilité
  doc.text("Client: Vente Cash", margin, y);
  y += 4;

  // Date et heure
  const dateCommande = commande.date_commande 
    ? new Date(commande.date_commande) 
    : new Date();
  const dateStr = dateCommande.toLocaleDateString("fr-FR", { 
    day: "2-digit", 
    month: "2-digit", 
    year: "numeric" 
  });
  const timeStr = dateCommande.toLocaleTimeString("fr-FR", { 
    hour: "2-digit", 
    minute: "2-digit" 
  });
  doc.text(`Date et heure de vente: ${dateStr} ${timeStr}`, margin, y);
  y += 5;

  // Ligne de séparation
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 3;

  // En-têtes du tableau - Format comme dans l'image
  doc.setFontSize(8.5); // Augmenté de 6.5 à 8.5
  doc.setFont(fontBold, "bold");
  doc.text("QTE", margin, y);
  doc.text("Description", margin + 8, y);
  doc.text("P.U", margin + 45, y);
  doc.text("P.T", margin + 60, y);
  y += 3.5;

  // Ligne de séparation sous les en-têtes
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 3;

  // Articles (plats et boissons)
  doc.setFont(fontNormal, "normal");
  doc.setFontSize(8.5); // Augmenté de 6.5 à 8.5 pour une meilleure lisibilité
  items.forEach((item) => {
    const nom = item.nom || (item.type === "boisson" ? `Boisson #${item.boisson_id || item.repas_id}` : `Repas #${item.repas_id}`);
    const qte = item.quantite || 1;
    const pu = Number(item.prix_unitaire || 0);
    const pt = Number(item.prix_total || pu * qte);

    // Quantité (format comme dans l'image: "1 BT" pour "1 Bouteille" ou juste le nombre)
    const qteStr = `${qte}`;
    doc.text(qteStr, margin, y);
    
    // Description (tronquer si trop long, max ~30 caractères)
    const maxDescWidth = 35;
    let nomToDisplay = nom;
    if (nom.length > 25) {
      nomToDisplay = nom.substring(0, 25) + "...";
    }
    doc.text(nomToDisplay, margin + 8, y);
    
    // Prix unitaire (format avec espaces pour les milliers)
    const puFormatted = pu.toLocaleString("fr-FR", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).replace(/\s/g, " ");
    doc.text(puFormatted, margin + 45, y, { align: "right" });
    
    // Prix total
    const ptFormatted = pt.toLocaleString("fr-FR", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).replace(/\s/g, " ");
    doc.text(ptFormatted, margin + 60, y, { align: "right" });
    
    y += 4; // Augmenté de 3.5 à 4 pour plus d'espace
    
    // Si le nom est trop long, afficher la suite sur la ligne suivante
    if (nom.length > 25) {
      doc.text(nom.substring(25), margin + 8, y);
      y += 3.5; // Augmenté de 3 à 3.5
    }
  });

  y += 2;
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 3.5;

  // Totaux - Format aligné à droite comme dans l'image
  // Calculer le sousTotal à partir de tous les items (plats + boissons)
  const sousTotal = items.reduce((sum, item) => {
    const prixTotal = Number(item.prix_total || 0);
    return sum + prixTotal;
  }, 0);
  const tva = 0; // Pas de TVA pour l'instant
  const remise = 0; // Pas de remise pour l'instant
  const netFC = sousTotal - remise;
  // Récupérer le taux de change depuis la base de données
  const { getTauxChange } = await import("./getTauxChange");
  const TAUX_CHANGE = await getTauxChange();
  const netUSD = netFC / TAUX_CHANGE;

  doc.setFontSize(8.5); // Augmenté de 6.5 à 8.5 pour les totaux
  doc.setFont(fontBold, "bold");
  doc.text("SOUS-TOTAL", margin + 50, y, { align: "right" });
  doc.setFont(fontNormal, "normal");
  const sousTotalFormatted = sousTotal.toLocaleString("fr-FR", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).replace(/\s/g, " ");
  doc.text(sousTotalFormatted, pageWidth - margin, y, { align: "right" });
  y += 3.5;

  doc.setFont(fontBold, "bold");
  doc.text("TVA", margin + 50, y, { align: "right" });
  doc.setFont(fontNormal, "normal");
  const tvaFormatted = tva.toLocaleString("fr-FR", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).replace(/\s/g, " ");
  doc.text(tvaFormatted, pageWidth - margin, y, { align: "right" });
  y += 3.5;

  doc.setFont(fontBold, "bold");
  doc.text("REMISE", margin + 50, y, { align: "right" });
  doc.setFont(fontNormal, "normal");
  const remiseFormatted = remise.toLocaleString("fr-FR", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).replace(/\s/g, " ");
  doc.text(remiseFormatted, pageWidth - margin, y, { align: "right" });
  y += 3.5;

  doc.setFont(fontBold, "bold");
  doc.text("NET FC", margin + 50, y, { align: "right" });
  doc.setFont(fontNormal, "normal");
  const netFCFormatted = netFC.toLocaleString("fr-FR", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).replace(/\s/g, " ");
  doc.text(netFCFormatted, pageWidth - margin, y, { align: "right" });
  y += 3.5;

  doc.setFont(fontBold, "bold");
  doc.text("NET $US", margin + 50, y, { align: "right" });
  doc.setFont(fontNormal, "normal");
  const netUSDFormatted = netUSD.toLocaleString("fr-FR", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).replace(/\s/g, " ");
  doc.text(netUSDFormatted, pageWidth - margin, y, { align: "right" });
  y += 4;

  // Ligne de séparation
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 3.5;

  // Personnel
  doc.setFontSize(8.5); // Augmenté de 6.5 à 8.5
  doc.setFont(fontBold, "bold");
  doc.text("Caissier:", margin, y);
  doc.setFont(fontNormal, "normal");
  doc.text(caissier?.nom || "N/A", margin + 18, y);
  y += 3.5;

  doc.setFont(fontBold, "bold");
  doc.text("Serveuse / Serveur:", margin, y);
  doc.setFont(fontNormal, "normal");
  doc.text(serveur?.nom || "N/A", margin + 18, y);
  y += 4;

  // Détails de paiement
  if (paiement) {
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 3.5;

    doc.setFontSize(8.5); // Augmenté de 6.5 à 8.5
    doc.setFont(fontBold, "bold");
    doc.text("Paiement:", margin, y);
    doc.setFont(fontNormal, "normal");
    doc.text("Payé", margin + 18, y);
    y += 3.5;

    const modePaiement = paiement.mode_paiement || "CASH";
    const devise = paiement.devise || "FRANC";
    const modePaiementStr = `${modePaiement} - ${devise === "DOLLAR" ? "$" : "FC"}`;
    
    doc.setFont(fontBold, "bold");
    doc.text("Mode de paiement:", margin, y);
    doc.setFont(fontNormal, "normal");
    doc.text(modePaiementStr, margin + 18, y);
    y += 3.5;

    doc.setFont(fontBold, "bold");
    doc.text("Montant payé:", margin, y);
    doc.setFont(fontNormal, "normal");
    const montantPaye = Number(paiement.montant || 0);
    const montantPayeFormatted = montantPaye.toLocaleString("fr-FR", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).replace(/\s/g, " ");
    doc.text(montantPayeFormatted, margin + 18, y);
    y += 3.5;

    doc.setFont(fontBold, "bold");
    doc.text("Montant retour:", margin, y);
    doc.setFont(fontNormal, "normal");
    const montantRetour = Math.max(0, montantPaye - netFC);
    const montantRetourFormatted = montantRetour.toLocaleString("fr-FR", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).replace(/\s/g, " ");
    doc.text(montantRetourFormatted, margin + 18, y);
    y += 4;

    // Date et heure du paiement (en bas, centré)
    if (paiement.date_paiement) {
      const datePaiement = new Date(paiement.date_paiement);
      const datePaiementStr = datePaiement.toLocaleDateString("fr-FR", { 
        day: "2-digit", 
        month: "2-digit", 
        year: "numeric" 
      });
      const timePaiementStr = datePaiement.toLocaleTimeString("fr-FR", { 
        hour: "2-digit", 
        minute: "2-digit" 
      });
      doc.setFontSize(6);
      doc.setFont(fontNormal, "normal");
      doc.text(`${datePaiementStr} ${timePaiementStr}`, pageWidth / 2, y, { align: "center" });
    }
  }

  return doc.output("arraybuffer");
}

export async function generateVentesExcel(ventes: any[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Ventes Pharmacie");
  ws.addRow(["ID", "Date", "Total"]);
  ventes.forEach((v) => ws.addRow([v.id, v.date_vente ? new Date(v.date_vente).toLocaleString() : "", Number(v.total ?? 0)]));
  const buf = await wb.xlsx.writeBuffer();
  return buf;
}

export async function generateCommandesExcel(commandes: any[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Commandes Restaurant");
  ws.addRow(["ID", "Table", "Statut", "Total", "Date"]);
  commandes.forEach((c) => ws.addRow([c.id, c.table_numero, c.statut, Number(c.total ?? 0), c.date_commande ? new Date(c.date_commande).toLocaleString() : ""]));
  const buf = await wb.xlsx.writeBuffer();
  return buf;
}


