import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { convertDecimalToNumber } from "@/lib/convertDecimal";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT"]);

const CalculCommissionSchema = z.object({
  personnel_id: z.number().int(),
  periode: z.string(), // Format: "YYYY-MM-DD" ou "YYYY-MM" ou "YYYY"
  taux_commission: z.number().min(0).max(100).default(5), // Pourcentage par défaut 5%
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const personnelId = searchParams.get("personnel_id");
  const periode = searchParams.get("periode");

  let where: any = {};
  if (personnelId) where.personnel_id = Number(personnelId);
  if (periode) {
    // Si période est au format YYYY-MM-DD, chercher ce jour
    // Si période est au format YYYY-MM, chercher ce mois
    // Si période est au format YYYY, chercher cette année
    if (periode.length === 10) {
      // Jour spécifique
      const date = new Date(periode);
      where.periode = {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lt: new Date(date.setHours(23, 59, 59, 999)),
      };
    } else if (periode.length === 7) {
      // Mois
      const [year, month] = periode.split("-");
      where.periode = {
        gte: new Date(`${year}-${month}-01`),
        lt: new Date(`${year}-${month}-31`),
      };
    } else if (periode.length === 4) {
      // Année
      where.periode = {
        gte: new Date(`${periode}-01-01`),
        lt: new Date(`${periode}-12-31`),
      };
    }
  }

  const commissions = await prisma.commissions.findMany({
    where,
    include: {
      personnel: true
    },
    orderBy: { periode: "desc" }
  });

  return NextResponse.json(convertDecimalToNumber(commissions));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = CalculCommissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Calculer le chiffre d'affaires du personnel pour la période
  const { personnel_id, periode, taux_commission } = parsed.data;
  
  // Déterminer la date de début et de fin selon le format de période
  let dateDebut: Date;
  let dateFin: Date;
  
  if (periode.length === 10) {
    // Jour spécifique
    dateDebut = new Date(periode);
    dateDebut.setHours(0, 0, 0, 0);
    dateFin = new Date(periode);
    dateFin.setHours(23, 59, 59, 999);
  } else if (periode.length === 7) {
    // Mois (YYYY-MM)
    const [year, month] = periode.split("-");
    dateDebut = new Date(`${year}-${month}-01`);
    // Dernier jour du mois : mois suivant, jour 0
    dateFin = new Date(Number(year), Number(month), 0);
    dateFin.setHours(23, 59, 59, 999);
  } else if (periode.length === 4) {
    // Année (YYYY)
    dateDebut = new Date(`${periode}-01-01`);
    dateFin = new Date(`${periode}-12-31T23:59:59.999`);
  } else {
    return NextResponse.json({ error: "Format de période invalide" }, { status: 400 });
  }

  // Récupérer les commandes validées du personnel pour la période
  const commandes = await prisma.commandes_bar.findMany({
    where: {
      serveur_id: personnel_id,
      status: "VALIDEE",
      date_commande: {
        gte: dateDebut,
        lte: dateFin,
      }
    },
    include: {
      details: true
    }
  });

  // Calculer le chiffre d'affaires total
  let chiffreAffaires = 0;
  for (const cmd of commandes) {
    for (const detail of cmd.details) {
      chiffreAffaires += Number(detail.prix_total);
    }
  }

  // Calculer la commission
  const montantCommission = (chiffreAffaires * taux_commission) / 100;

  // Vérifier si une commission existe déjà pour cette période
  const periodeDate = new Date(periode);
  if (periode.length === 7) {
    periodeDate.setDate(1); // Premier jour du mois
  } else if (periode.length === 4) {
    periodeDate.setMonth(0, 1); // Premier jour de l'année
  }

  const existing = await prisma.commissions.findFirst({
    where: {
      personnel_id,
      periode: periodeDate
    }
  });

  if (existing) {
    // Mettre à jour la commission existante
    const updated = await prisma.commissions.update({
      where: { id: existing.id },
      data: { montant: montantCommission }
    });
    return NextResponse.json(convertDecimalToNumber({
      ...updated,
      chiffreAffaires,
      taux_commission
    }));
  } else {
    // Créer une nouvelle commission
    const created = await prisma.commissions.create({
      data: {
        personnel_id,
        montant: montantCommission,
        periode: periodeDate
      }
    });
    return NextResponse.json(convertDecimalToNumber({
      ...created,
      chiffreAffaires,
      taux_commission
    }), { status: 201 });
  }
}

