import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { convertDecimalToNumber } from "@/lib/convertDecimal";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR", "CAISSE_BAR", "CAISSIER", "BAR", "MANAGER_MULTI"]);

const ItemSchema = z.object({ boisson_id: z.number().int(), quantite: z.number().int().positive() });
const CreateSchema = z.object({ table_id: z.number().int().optional().nullable(), serveur_id: z.number().int().optional().nullable(), items: z.array(ItemSchema).min(1) });

export async function GET() {
  const commandes = await prisma.commandes_bar.findMany({ orderBy: { date_commande: "desc" }, include: { table: true, serveur: true } });
  return NextResponse.json(convertDecimalToNumber(commandes));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const body = await req.json();
  const parsed = CreateSchema.safeParse({
    table_id: body?.table_id ? Number(body.table_id) : null,
    serveur_id: body?.serveur_id ? Number(body.serveur_id) : null,
    items: Array.isArray(body?.items) ? body.items.map((i: any) => ({ boisson_id: Number(i.boisson_id), quantite: Number(i.quantite) })) : [],
  });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const ids = parsed.data.items.map((i) => i.boisson_id);
  const boissons = await prisma.boissons.findMany({ where: { id: { in: ids } } });
  const prixById = new Map<number, number>();
  const stockById = new Map<number, number>();
  boissons.forEach((b) => {
    prixById.set(b.id, Number(b.prix_vente));
    stockById.set(b.id, Number(b.stock));
  });
  for (const it of parsed.data.items) {
    const stock = stockById.get(it.boisson_id) ?? 0;
    if (stock < it.quantite) return NextResponse.json({ error: `Stock insuffisant pour boisson ${it.boisson_id}` }, { status: 400 });
  }

  const total = parsed.data.items.reduce((acc, it) => acc + (prixById.get(it.boisson_id) ?? 0) * it.quantite, 0);

  const result = await prisma.$transaction(async (tx) => {
    const cmd = await tx.commandes_bar.create({
      data: { table_id: parsed.data.table_id ?? null, serveur_id: parsed.data.serveur_id ?? null },
    });
    for (const it of parsed.data.items) {
      await tx.commande_details.create({
        data: {
          commande_id: cmd.id,
          boisson_id: it.boisson_id,
          quantite: it.quantite,
          prix_total: (prixById.get(it.boisson_id) ?? 0) * it.quantite,
        },
      });
      await tx.boissons.update({ where: { id: it.boisson_id }, data: { stock: { decrement: it.quantite } } });
      await tx.mouvements_stock.create({ data: { boisson_id: it.boisson_id, type: "SORTIE" as any, quantite: it.quantite } });
    }
    return cmd;
  });

  return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
}

