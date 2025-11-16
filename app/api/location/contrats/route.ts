import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { convertDecimalToNumber } from "@/lib/convertDecimal";

const allowed = new Set(["ADMIN", "MANAGER_MULTI", "CAISSE_LOCATION"]);

const ContratSchema = z.object({
  bien_id: z.number().int(),
  locataire_id: z.number().int(),
  date_debut: z.string(),
  date_fin: z.string(),
  depot_garantie: z.number().optional().nullable(),
  avance: z.number().optional().nullable(),
  statut: z.enum(["ACTIF", "TERMINE", "EN_ATTENTE"]).optional().default("EN_ATTENTE"),
});

export async function GET() {
  const itemsRaw = await prisma.contrats.findMany({ orderBy: { date_debut: "desc" }, include: { bien: true, locataire: true } });
  const items = convertDecimalToNumber(itemsRaw);
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const body = await req.json();
  const parsed = ContratSchema.safeParse({
    ...body,
    bien_id: Number(body?.bien_id),
    locataire_id: Number(body?.locataire_id),
    depot_garantie: body?.depot_garantie ? Number(body.depot_garantie) : null,
    avance: body?.avance ? Number(body.avance) : null,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const created = await prisma.contrats.create({
    data: {
      bien_id: parsed.data.bien_id,
      locataire_id: parsed.data.locataire_id,
      date_debut: new Date(parsed.data.date_debut),
      date_fin: new Date(parsed.data.date_fin),
      depot_garantie: parsed.data.depot_garantie,
      avance: parsed.data.avance,
      statut: parsed.data.statut as any,
    },
  });
  
  // Mettre à jour l'état du bien si le contrat est actif
  if (parsed.data.statut === "ACTIF") {
    await prisma.biens.update({ where: { id: parsed.data.bien_id }, data: { etat: "OCCUPE" as any } });
  }
  
  return NextResponse.json(convertDecimalToNumber(created), { status: 201 });
}

