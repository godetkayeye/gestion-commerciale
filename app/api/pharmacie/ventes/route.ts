import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const allowed = new Set(["ADMIN", "GERANT_PHARMACIE", "CAISSIER", "PHARMACIEN"]);

const ItemSchema = z.object({ medicament_id: z.number().int(), quantite: z.number().int().positive() });
const CreateSchema = z.object({ items: z.array(ItemSchema).min(1), payer: z.boolean().optional().default(true) });

export async function GET(req: Request) {
  // Allow filtering by period or explicit dates and by product id
  const url = new URL(req.url);
  const period = url.searchParams.get("period"); // daily|weekly|monthly
  const startDateParam = url.searchParams.get("startDate");
  const endDateParam = url.searchParams.get("endDate");
  const productIdParam = url.searchParams.get("productId");

  const where: Record<string, unknown> = {};

  // compute date range
  if (startDateParam || endDateParam) {
    const start = startDateParam ? new Date(startDateParam) : new Date(0);
    const end = endDateParam ? new Date(endDateParam) : new Date();
    where.date_vente = { gte: start, lte: end };
  } else if (period) {
    const now = new Date();
    let start: Date;
    if (period === "daily") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === "weekly") {
      // week starting Monday
      const day = now.getDay();
      const diff = (day + 6) % 7; // days since Monday
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
    } else if (period === "monthly") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      start = new Date(0);
    }
    where.date_vente = { gte: start };
  }

  // if filtering by productId, we need ventes that have at least one detail with that medicament_id
  if (productIdParam) {
    const productId = Number(productIdParam);
    const ventes = await prisma.vente_pharmacie.findMany({
      where: where,
      orderBy: { date_vente: "desc" },
      include: { details: { where: { medicament_id: productId }, include: { medicament: true } } },
    });
    // The above will include ventes with details filtered; but we need to include all details for display. Fetch full ventes for the matching vente ids
    const venteIds = ventes.map((v) => v.id);
    const full = await prisma.vente_pharmacie.findMany({
      where: { id: { in: venteIds } },
      orderBy: { date_vente: "desc" },
      include: { details: { include: { medicament: true } } },
    });
    return NextResponse.json(full);
  }

  // default: no product filter
  const ventes = await prisma.vente_pharmacie.findMany({ where, orderBy: { date_vente: "desc" }, include: { details: { include: { medicament: true } } } });
  return NextResponse.json(ventes);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  const body = await req.json();
  const parsed = CreateSchema.safeParse({
    items: Array.isArray(body?.items)
      ? (body.items as unknown[]).map((i) => {
          const obj = i as Record<string, unknown>;
          return { medicament_id: Number(obj.medicament_id), quantite: Number(obj.quantite) };
        })
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


