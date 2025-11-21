import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const allowed = new Set(["ADMIN", "CAISSIER", "MANAGER_MULTI"]);

const ItemSchema = z.object({ medicament_id: z.number().int(), quantite: z.number().int().positive() });
const CreateSchema = z.object({ items: z.array(ItemSchema).min(1), payer: z.boolean().optional().default(true) });

export async function GET() {
  const ventes = await prisma.vente_pharmacie.findMany({ orderBy: { date_vente: "desc" }, include: { details: true } });
  return NextResponse.json(ventes);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  const body = await req.json();
  const parsed = CreateSchema.safeParse({
    items: Array.isArray(body?.items)
      ? body.items.map((i: any) => ({ medicament_id: Number(i.medicament_id), quantite: Number(i.quantite) }))
      : [],
    payer: Boolean(body?.payer ?? true),
  });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const ids = parsed.data.items.map((i) => i.medicament_id);
  const produits = await prisma.medicament.findMany({ where: { id: { in: ids } } });
  const prixById = new Map<number, number>();
  const stockById = new Map<number, number>();
  produits.forEach((p) => {
    prixById.set(p.id, Number(p.prix_unitaire));
    stockById.set(p.id, Number(p.quantite_stock));
  });
  for (const it of parsed.data.items) {
    const stock = stockById.get(it.medicament_id) ?? 0;
    if (stock < it.quantite) return NextResponse.json({ error: `Stock insuffisant pour ${it.medicament_id}` }, { status: 400 });
  }

  const total = parsed.data.items.reduce((acc, it) => acc + (prixById.get(it.medicament_id) ?? 0) * it.quantite, 0);

  const result = await prisma.$transaction(async (tx) => {
    const vente = await tx.vente_pharmacie.create({
      data: { total, utilisateur_id: null },
    });
    for (const it of parsed.data.items) {
      await tx.details_vente_pharmacie.create({
        data: {
          vente_id: vente.id,
          medicament_id: it.medicament_id,
          quantite: it.quantite,
          prix_total: (prixById.get(it.medicament_id) ?? 0) * it.quantite,
        },
      });
      await tx.medicament.update({ where: { id: it.medicament_id }, data: { quantite_stock: { decrement: it.quantite } } });
    }
    if (parsed.data.payer) {
      await tx.paiement.create({ data: { module: "PHARMACIE" as any, reference_id: vente.id, montant: total, mode_paiement: "CASH" as any } });
    }
    return vente;
  });

  return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
}


