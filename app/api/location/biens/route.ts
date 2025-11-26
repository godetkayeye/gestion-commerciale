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
  superficie: z.number().positive().optional(),
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
    superficie: body?.superficie ? Number(body.superficie) : undefined,
    prix_mensuel: Number(body?.prix_mensuel),
    nombre_pieces: Number(body?.nombre_pieces),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const { superficie, ...rest } = parsed.data;
    const data: any = { ...rest, adresse: parsed.data.adresse ?? parsed.data.nom };
    if (typeof superficie === "number" && !Number.isNaN(superficie)) {
      data.superficie = superficie;
    }
    console.log("[biens][POST][create] Données à créer:", JSON.stringify(data, null, 2));
    const created = await prisma.biens.create({ data });
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("[biens][POST][create] Erreur complète:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
      error: error,
    });
    
    // Messages d'erreur plus détaillés
    let errorMessage = "Impossible d'enregistrer le bien";
    let errorDetails = typeof error?.message === "string" ? error.message : "Erreur inconnue";
    
    // Erreurs spécifiques de Prisma
    if (error?.code === "P2002") {
      errorMessage = "Un bien avec ces caractéristiques existe déjà";
      errorDetails = error?.meta?.target ? `Champ en conflit: ${JSON.stringify(error.meta.target)}` : errorDetails;
    } else if (error?.code === "P2003") {
      errorMessage = "Référence invalide";
      errorDetails = error?.meta?.field_name ? `Champ: ${error.meta.field_name}` : errorDetails;
    } else if (error?.message?.includes("Unknown column")) {
      errorMessage = "Colonne manquante dans la base de données";
      errorDetails = "Veuillez exécuter les migrations SQL nécessaires";
    }
    
    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        code: error?.code || "UNKNOWN",
      },
      { status: 500 },
    );
  }
}

