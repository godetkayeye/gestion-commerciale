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
  
  // Déterminer l'état de la commande (payée ou non payée)
  // Vérifier à la fois le paiement et le statut de la commande
  const statutCommande = (commande as any).statut;
  const estPayee = (paiement !== null && paiement !== undefined) || statutCommande === "PAYE";
  const typeDocument = estPayee ? "FACTURE" : "ADDITION";
  
  // Log pour debug
  console.log(`[FACTURE PDF] Commande ${commande.id} - estPayee:`, {
    paiement: paiement ? "OUI" : "NON",
    statutCommande,
    estPayee,
    typeDocument,
  });
  
  // Badge d'état de la commande - En haut, bien visible
  if (estPayee) {
    doc.setFillColor(34, 197, 94); // Vert si payée
  } else {
    doc.setFillColor(239, 68, 68); // Rouge si non payée
  }
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 6, 1, 1, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont(fontBold, "bold");
  doc.text(typeDocument, pageWidth / 2, y + 4.2, { align: "center" });
  y += 8;
  
  // Réinitialiser la couleur du texte
  doc.setTextColor(0, 0, 0);
  
  // En-tête de l'établissement - Section améliorée avec polices plus grandes
  doc.setFontSize(14);
  doc.setFont(fontBold, "bold");
  doc.text("FACTURE DE VENTE", pageWidth / 2, y, { align: "center" });
  y += 7;

  // Nom de l'établissement (à personnaliser)
  doc.setFontSize(13);
  doc.setFont(fontBold, "bold");
  doc.text("Vilakazi", pageWidth / 2, y, { align: "center" });
  y += 5.5;

  doc.setFontSize(10);
  doc.setFont(fontNormal, "normal");
  doc.text("AFRO - FOOD - KULTURE - EVENT", pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.setFontSize(9.5);
  doc.text("22, Tombalbay, Kinshasa / Gombe", pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.setFontSize(10);
  doc.setFont(fontBold, "bold");
  doc.text("+243 812 769 071 / 892 079 726", pageWidth / 2, y, { align: "center" });
  y += 7;

  // Ligne de séparation plus épaisse
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Section Informations de la facture - Améliorée avec polices plus grandes
  doc.setFontSize(11);
  doc.setFont(fontBold, "bold");
  doc.text(`N°: ${commande.id}`, margin, y);
  y += 6;

  // Client
  doc.setFont(fontNormal, "normal");
  doc.setFontSize(10);
  doc.text("Client: Vente Cash", margin, y);
  y += 5.5;

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
  doc.text(`Date et heure: ${dateStr} ${timeStr}`, margin, y);
  y += 7;

  // Ligne de séparation
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // Récupérer le taux de change pour convertir les prix en USD
  const { getTauxChange } = await import("./getTauxChange");
  const TAUX_CHANGE = await getTauxChange();
  
  // Positions des colonnes - Format simple et propre comme sur la photo
  const qteX = margin; // Position quantité
  const descX = margin + 8; // Position description (après QTE)
  const puX = margin + 48; // Position prix unitaire
  const ptX = margin + 62; // Position prix total
  const tableEndX = pageWidth - margin;
  
  // Fonction pour découper le texte dans une largeur donnée
  const splitTextToWidth = (text: string, maxWidth: number): string[] => {
    const charsPerLine = Math.floor(maxWidth * 2.0);
    
    if (text.length <= charsPerLine) {
      return [text];
    }
    
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      
      if (testLine.length > charsPerLine && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines.length > 0 ? lines : [text.substring(0, charsPerLine)];
  };
  
  // En-têtes du tableau - Format simple
  doc.setFontSize(10);
  doc.setFont(fontBold, "bold");
  doc.text("QTE", qteX, y);
  doc.text("Description", descX, y);
  doc.text("P.U", puX, y);
  doc.text("P.T", ptX, y);
  y += 5;
  
  // Ligne de séparation sous les en-têtes
  doc.setLineWidth(0.3);
  doc.line(margin, y, tableEndX, y);
  y += 5;
  
  // Articles (plats et boissons)
  doc.setFont(fontNormal, "normal");
  doc.setFontSize(10);
  
  items.forEach((item) => {
    const nom = item.nom || (item.type === "boisson" ? `Boisson #${item.boisson_id || item.repas_id}` : `Repas #${item.repas_id}`);
    const qte = item.quantite || 1;
    const puFC = Number(item.prix_unitaire || 0);
    const ptFC = Number(item.prix_total || puFC * qte);
    
    // Convertir les prix de FC en USD
    const puUSD = puFC / TAUX_CHANGE;
    const ptUSD = ptFC / TAUX_CHANGE;
    
    // Formater les prix
    const puFormatted = `$${puUSD.toLocaleString("fr-FR", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).replace(/\s/g, " ")}`;
    
    const ptFormatted = `$${ptUSD.toLocaleString("fr-FR", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).replace(/\s/g, " ")}`;
    
    // Quantité
    const qteStr = `${qte}`;
    doc.text(qteStr, qteX, y);
    
    // Description (découper si nécessaire)
    const maxDescWidth = puX - descX - 2; // Largeur max pour la description (avant P.U)
    const descLines = splitTextToWidth(nom, maxDescWidth);
    const firstDescLine = descLines[0];
    doc.text(firstDescLine, descX, y);
    
    // Prix unitaire (aligné à droite)
    doc.text(puFormatted, puX, y, { align: "right" });
    
    // Prix total (aligné à droite)
    doc.text(ptFormatted, ptX, y, { align: "right" });
    
    y += 5;
    
    // Si la description a plusieurs lignes, afficher les lignes suivantes
    if (descLines.length > 1) {
      for (let i = 1; i < descLines.length; i++) {
        // Description sur la ligne suivante (sans les prix)
        doc.text(descLines[i], descX, y);
        y += 4.5;
      }
    }
  });
  
  // Ligne de séparation avant les totaux
  doc.setLineWidth(0.3);
  doc.line(margin, y, tableEndX, y);
  y += 5;

  y += 4;
  // Ligne de séparation avant les totaux - Plus visible
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5.5;

  // Totaux - Format aligné à droite comme dans l'image
  // Calculer le sousTotal à partir de tous les items (plats + boissons) en FC
  const sousTotalFC = items.reduce((sum, item) => {
    const prixTotal = Number(item.prix_total || 0);
    return sum + prixTotal;
  }, 0);
  const tva = 0; // Pas de TVA pour l'instant
  const remise = 0; // Pas de remise pour l'instant
  const netFC = sousTotalFC - remise;
  // Convertir en USD (TAUX_CHANGE déjà récupéré plus haut)
  const sousTotalUSD = sousTotalFC / TAUX_CHANGE;
  const netUSD = netFC / TAUX_CHANGE;

  // Section Totaux - Améliorée avec meilleure visibilité et polices plus grandes
  doc.setFontSize(10);
  doc.setFont(fontBold, "bold");
  doc.text("SOUS-TOTAL", margin + 50, y, { align: "right" });
  doc.setFont(fontNormal, "normal");
  const sousTotalFormatted = sousTotalFC.toLocaleString("fr-FR", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).replace(/\s/g, " ");
  doc.text(sousTotalFormatted, pageWidth - margin, y, { align: "right" });
  y += 5.5;

  doc.setFont(fontBold, "bold");
  doc.text("TVA", margin + 50, y, { align: "right" });
  doc.setFont(fontNormal, "normal");
  const tvaFormatted = tva.toLocaleString("fr-FR", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).replace(/\s/g, " ");
  doc.text(tvaFormatted, pageWidth - margin, y, { align: "right" });
  y += 5.5;

  doc.setFont(fontBold, "bold");
  doc.text("REMISE", margin + 50, y, { align: "right" });
  doc.setFont(fontNormal, "normal");
  const remiseFormatted = remise.toLocaleString("fr-FR", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).replace(/\s/g, " ");
  doc.text(remiseFormatted, pageWidth - margin, y, { align: "right" });
  y += 5.5;

  // NET FC - Mise en évidence avec police plus grande
  doc.setFont(fontBold, "bold");
  doc.setFontSize(11);
  doc.text("NET FC", margin + 50, y, { align: "right" });
  doc.setFont(fontNormal, "normal");
  const netFCFormatted = netFC.toLocaleString("fr-FR", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).replace(/\s/g, " ");
  doc.text(netFCFormatted, pageWidth - margin, y, { align: "right" });
  y += 5.5;

  // NET $US - Mise en évidence avec police plus grande
  doc.setFont(fontBold, "bold");
  doc.text("NET $US", margin + 50, y, { align: "right" });
  doc.setFont(fontNormal, "normal");
  const netUSDFormatted = netUSD.toLocaleString("fr-FR", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).replace(/\s/g, " ");
  doc.text(netUSDFormatted, pageWidth - margin, y, { align: "right" });
  y += 6.5;

  // Ligne de séparation - Plus visible
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Section Personnel - Améliorée avec polices plus grandes
  doc.setFontSize(10);
  doc.setFont(fontBold, "bold");
  doc.text("Caissier:", margin, y);
  doc.setFont(fontNormal, "normal");
  doc.text(caissier?.nom || "N/A", margin + 22, y);
  y += 5.5;

  doc.setFont(fontBold, "bold");
  doc.text("Serveur:", margin, y);
  doc.setFont(fontNormal, "normal");
  doc.text(serveur?.nom || "N/A", margin + 22, y);
  y += 6.5;

  // Section Détails de paiement - Améliorée avec polices plus grandes
  // Utiliser estPayee au lieu de paiement pour être cohérent avec le badge
  if (estPayee) {
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont(fontBold, "bold");
    doc.text("Paiement:", margin, y);
    doc.setFont(fontNormal, "normal");
    doc.text("Payé", margin + 22, y);
    y += 5.5;

    // Si on a les détails du paiement, les afficher
    if (paiement) {
      const modePaiement = paiement.mode_paiement || "CASH";
      const devise = paiement.devise || "FRANC";
      const modePaiementStr = `${modePaiement} - ${devise === "DOLLAR" ? "$" : "FC"}`;
      
      doc.setFont(fontBold, "bold");
      doc.text("Mode:", margin, y);
      doc.setFont(fontNormal, "normal");
      doc.text(modePaiementStr, margin + 22, y);
      y += 5.5;

      doc.setFont(fontBold, "bold");
      doc.text("Montant payé:", margin, y);
      doc.setFont(fontNormal, "normal");
      const montantPaye = Number(paiement.montant || 0);
      const montantPayeFormatted = montantPaye.toLocaleString("fr-FR", { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }).replace(/\s/g, " ");
      doc.text(montantPayeFormatted, margin + 22, y);
      y += 5.5;

      doc.setFont(fontBold, "bold");
      doc.text("Montant retour:", margin, y);
      doc.setFont(fontNormal, "normal");
      const montantRetour = Math.max(0, montantPaye - netFC);
      const montantRetourFormatted = montantRetour.toLocaleString("fr-FR", { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }).replace(/\s/g, " ");
      doc.text(montantRetourFormatted, margin + 22, y);
      y += 7;

      // Date et heure du paiement (en bas, centré) - Améliorée avec police plus grande
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
        doc.setFontSize(9);
        doc.setFont(fontNormal, "normal");
        doc.text(`${datePaiementStr} ${timePaiementStr}`, pageWidth / 2, y, { align: "center" });
      }
    } else {
      // Si la commande est payée mais qu'on n'a pas les détails du paiement
      // Afficher juste "Payé" sans les détails
      doc.setFont(fontBold, "bold");
      doc.text("Statut:", margin, y);
      doc.setFont(fontNormal, "normal");
      doc.text("Commande payée", margin + 22, y);
      y += 7;
    }
  } else {
    // Si non payée, afficher un message clair
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
    
    doc.setFontSize(10);
    doc.setFont(fontBold, "bold");
    doc.setTextColor(239, 68, 68); // Rouge
    doc.text("NON PAYÉE", pageWidth / 2, y, { align: "center" });
    doc.setTextColor(0, 0, 0); // Réinitialiser la couleur
    y += 5.5;
    
    doc.setFont(fontNormal, "normal");
    doc.setFontSize(9);
    doc.text("Cette addition n'a pas encore", pageWidth / 2, y, { align: "center" });
    y += 4.5;
    doc.text("été payée", pageWidth / 2, y, { align: "center" });
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


