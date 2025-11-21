import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { convertDecimalToNumber } from "@/lib/convertDecimal";
import { ensureBiensExtendedColumns } from "./utils";

const allowed = new Set(["ADMIN", "MANAGER_MULTI"]);

const allowedTypes = ["APPARTEMENT", "LOCAL_COMMERCIAL"] as const;
const niveauValues = ["REZ_DE_CHAUSSEE", "N1", "N2", "N3", "N4"] as const;

const BienSchema = z.object({
  type: z.enum(allowedTypes),
  nom: z.string().min(2),
  niveau: z.enum(niveauValues),
  adresse: z.string().min(1).optional(),
  superficie: z.number().positive(),
  prix_mensuel: z.number().nonnegative(),
  nombre_pieces: z.number().int().positive(),
  description: z.string().optional().nullable(),
  etat: z.enum(["LIBRE", "OCCUPE", "MAINTENANCE"]).optional().default("LIBRE"),
});

export async function GET() {
  await ensureBiensExtendedColumns();
  const itemsRaw = await prisma.biens.findMany({ orderBy: { adresse: "asc" }, include: { contrats: { where: { statut: "ACTIF" as any } } } });
  const items = convertDecimalToNumber(itemsRaw);
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  await ensureBiensExtendedColumns();
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const body = await req.json();
  const parsed = BienSchema.safeParse({
    ...body,
    superficie: Number(body?.superficie),
    prix_mensuel: Number(body?.prix_mensuel),
    nombre_pieces: Number(body?.nombre_pieces),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const data = { ...parsed.data, adresse: parsed.data.adresse ?? parsed.data.nom };
    const created = await prisma.biens.create({ data });
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("[biens][POST][create]", error);
    return NextResponse.json(
      {
        error: "Impossible d'enregistrer le bien",
        details: typeof error?.message === "string" ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    );
  }
}

