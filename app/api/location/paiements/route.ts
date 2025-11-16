import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { convertDecimalToNumber } from "@/lib/convertDecimal";

const allowed = new Set(["ADMIN", "MANAGER_MULTI", "CAISSE_LOCATION"]);

const PaiementSchema = z.object({
  contrat_id: z.number().int(),
  montant: z.number().nonnegative(),
  date_paiement: z.string(),
  reste_du: z.number().optional().default(0),
  penalite: z.number().optional().default(0),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const contratId = searchParams.get("contrat_id");

  let where: any = {};
  if (contratId) {
    where.contrat_id = Number(contratId);
  }

  const itemsRaw = await prisma.paiements_location.findMany({ 
    where,
    orderBy: { date_paiement: "desc" }, 
    include: { 
      contrat: { 
        include: { 
          bien: true, 
          locataire: true 
        } 
      } 
    } 
  });
  const items = convertDecimalToNumber(itemsRaw);
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const body = await req.json();
  const parsed = PaiementSchema.safeParse({
    ...body,
    contrat_id: Number(body?.contrat_id),
    montant: Number(body?.montant),
    reste_du: Number(body?.reste_du ?? 0),
    penalite: Number(body?.penalite ?? 0),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Vérifier que le contrat existe
  const contrat = await prisma.contrats.findUnique({
    where: { id: parsed.data.contrat_id },
    include: { bien: true }
  });

  if (!contrat) {
    return NextResponse.json({ error: "Contrat introuvable" }, { status: 404 });
  }

  const created = await prisma.paiements_location.create({
    data: {
      contrat_id: parsed.data.contrat_id,
      montant: parsed.data.montant,
      date_paiement: new Date(parsed.data.date_paiement),
      reste_du: parsed.data.reste_du,
      penalite: parsed.data.penalite,
    },
  });
  
  return NextResponse.json(convertDecimalToNumber(created), { status: 201 });
}

