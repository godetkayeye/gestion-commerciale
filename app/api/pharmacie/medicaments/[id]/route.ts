import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const allowed = new Set(["ADMIN", "GERANT_PHARMACIE", "PHARMACIEN"]);

const MedicamentSchema = z.object({
  nom: z.string().min(1),
  categorie_id: z.number().int().optional().nullable(),
  prix_unitaire: z.number().nonnegative(),
  quantite_stock: z.number().int().nonnegative(),
  date_expiration: z.string().optional().nullable(),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const id = Number(params.id);
  const body = await req.json();
  const parsed = MedicamentSchema.safeParse({
    ...body,
    prix_unitaire: Number(body?.prix_unitaire),
    quantite_stock: Number(body?.quantite_stock),
    categorie_id: body?.categorie_id ? Number(body.categorie_id) : null,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { nom, categorie_id, prix_unitaire, quantite_stock, date_expiration } = parsed.data;
  const updated = await prisma.medicament.update({
    where: { id },
    data: {
      nom,
      categorie_id: categorie_id ?? null,
      prix_unitaire,
      quantite_stock,
      date_expiration: date_expiration ? new Date(date_expiration) : null,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const id = Number(params.id);
  await prisma.medicament.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}


