import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { convertDecimalToNumber } from "@/lib/convertDecimal";

const allowed = new Set(["ADMIN", "CAISSE_RESTAURANT", "CAISSIER", "MANAGER_MULTI", "CONSEIL_ADMINISTRATION"]);

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const aujourdhui = searchParams.get("aujourdhui") === "true";
  const referenceId = searchParams.get("reference_id");

  const aujourdhuiDate = new Date();
  aujourdhuiDate.setHours(0, 0, 0, 0);
  const finAujourdhui = new Date(aujourdhuiDate);
  finAujourdhui.setHours(23, 59, 59, 999);

  const where: any = {
    module: "RESTAURANT" as any,
  };

  if (referenceId) {
    where.reference_id = Number(referenceId);
  }

  if (aujourdhui) {
    where.date_paiement = {
      gte: aujourdhuiDate,
      lte: finAujourdhui,
    };
  }

  // Utiliser une requête SQL brute pour éviter les problèmes avec l'enum Devise
  let paiementsRaw: any[] = [];
  if (referenceId) {
    paiementsRaw = await prisma.$queryRaw<Array<{
      id: number;
      module: string;
      reference_id: number;
      montant: any;
      mode_paiement: string;
      devise: string;
      caissier_id: number | null;
      date_paiement: Date | null;
    }>>`
      SELECT id, module, reference_id, montant, mode_paiement, 
             UPPER(devise) as devise, caissier_id, date_paiement
      FROM paiement
      WHERE module = 'restaurant' AND reference_id = ${Number(referenceId)}
      ORDER BY date_paiement DESC
      LIMIT 100
    `;
  } else if (aujourdhui) {
    paiementsRaw = await prisma.$queryRaw<Array<{
      id: number;
      module: string;
      reference_id: number;
      montant: any;
      mode_paiement: string;
      devise: string;
      caissier_id: number | null;
      date_paiement: Date | null;
    }>>`
      SELECT id, module, reference_id, montant, mode_paiement, 
             UPPER(devise) as devise, caissier_id, date_paiement
      FROM paiement
      WHERE module = 'restaurant'
        AND date_paiement >= ${aujourdhuiDate}
        AND date_paiement <= ${finAujourdhui}
      ORDER BY date_paiement DESC
      LIMIT 100
    `;
  } else {
    paiementsRaw = await prisma.$queryRaw<Array<{
      id: number;
      module: string;
      reference_id: number;
      montant: any;
      mode_paiement: string;
      devise: string;
      caissier_id: number | null;
      date_paiement: Date | null;
    }>>`
      SELECT id, module, reference_id, montant, mode_paiement, 
             UPPER(devise) as devise, caissier_id, date_paiement
      FROM paiement
      WHERE module = 'restaurant'
      ORDER BY date_paiement DESC
      LIMIT 100
    `;
  }

  // Récupérer les caissiers séparément pour éviter les problèmes de type
  const paiements = await Promise.all(
    paiementsRaw.map(async (paiement: any) => {
      const paiementData: any = { ...paiement };
      
      if (paiement.caissier_id) {
        try {
          paiementData.caissier = await prisma.utilisateur.findUnique({
            where: { id: paiement.caissier_id },
            select: { id: true, nom: true, email: true },
          });
        } catch (e) {
          console.error("Erreur lors de la récupération du caissier:", e);
        }
      }
      
      return paiementData;
    })
  );

  return NextResponse.json(convertDecimalToNumber(paiements));
}

