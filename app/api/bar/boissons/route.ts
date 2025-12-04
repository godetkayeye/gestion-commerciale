import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { convertDecimalToNumber } from "@/lib/convertDecimal";

const allowedGet = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR", "CAISSE_BAR", "CAISSE_RESTAURANT", "BAR", "MANAGER_MULTI", "ECONOMAT", "SUPERVISEUR", "CONSEIL_ADMINISTRATION"]);
const allowedPost = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR", "CAISSE_BAR", "CAISSE_RESTAURANT", "BAR", "MANAGER_MULTI"]);

const BoissonSchema = z.object({
  nom: z.string().min(1),
  categorie_id: z.number().int().optional().nullable(),
  prix_achat: z.number().nonnegative(),
  prix_vente: z.number().nonnegative(),
  prix_verre: z.number().nonnegative().optional().nullable(),
  stock: z.number().nonnegative(), // Permet les valeurs décimales (ex: 0.7 bouteille)
  unite_mesure: z.string().optional().default("unités"),
  vente_en_bouteille: z.boolean().optional().default(true),
  vente_en_verre: z.boolean().optional().default(false),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowedGet.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const items = await prisma.boissons.findMany({ orderBy: { nom: "asc" }, include: { categorie: true } });
  return NextResponse.json(convertDecimalToNumber(items));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowedPost.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const body = await req.json();
  const parsed = BoissonSchema.safeParse({
    ...body,
    prix_achat: Number(body?.prix_achat),
    prix_vente: Number(body?.prix_vente),
    prix_verre: body?.prix_verre ? Number(body.prix_verre) : null,
    stock: Number(body?.stock),
    categorie_id: body?.categorie_id ? Number(body.categorie_id) : null,
    vente_en_bouteille: body?.vente_en_bouteille !== undefined ? Boolean(body.vente_en_bouteille) : true,
    vente_en_verre: body?.vente_en_verre !== undefined ? Boolean(body.vente_en_verre) : false,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const created = await prisma.boissons.create({ data: parsed.data });
  return NextResponse.json(convertDecimalToNumber(created), { status: 201 });
}

