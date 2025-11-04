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

import { jsPDF } from "jspdf";
import ExcelJS from "exceljs";

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


