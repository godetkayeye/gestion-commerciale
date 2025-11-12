import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { convertDecimalToNumber } from "@/lib/convertDecimal";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR"]);

const BoissonSchema = z.object({
  nom: z.string().min(1),
  categorie_id: z.number().int().optional().nullable(),
  prix_achat: z.number().nonnegative(),
  prix_vente: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  unite_mesure: z.string().optional().default("unités"),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const id = Number(params.id);
  const body = await req.json();
  const parsed = BoissonSchema.safeParse({
    ...body,
    prix_achat: Number(body?.prix_achat),
    prix_vente: Number(body?.prix_vente),
    stock: Number(body?.stock),
    categorie_id: body?.categorie_id ? Number(body.categorie_id) : null,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const updated = await prisma.boissons.update({ where: { id }, data: parsed.data });
  return NextResponse.json(convertDecimalToNumber(updated));
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const id = Number(params.id);
  await prisma.boissons.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

