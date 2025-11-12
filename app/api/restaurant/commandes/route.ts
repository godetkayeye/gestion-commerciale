import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR", "CAISSIER"]);

const ItemSchema = z.object({ repas_id: z.number().int(), quantite: z.number().int().positive() });
const CreateSchema = z.object({ table_numero: z.string().min(1), items: z.array(ItemSchema).min(1) });

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const statut = searchParams.get("statut") ?? undefined;
  const commandes = await prisma.commande.findMany({
    where: statut ? { statut: (statut as any) } : undefined,
    orderBy: { date_commande: "desc" },
  });
  return NextResponse.json(commandes);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const body = await req.json();
  const parsed = CreateSchema.safeParse({
    table_numero: body?.table_numero,
    items: Array.isArray(body?.items)
      ? body.items.map((i: any) => ({ repas_id: Number(i.repas_id), quantite: Number(i.quantite) }))
      : [],
  });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const prixById = new Map<number, number>();
  const repasIds = parsed.data.items.map((i) => i.repas_id);
  const plats = await prisma.repas.findMany({ where: { id: { in: repasIds } } });
  plats.forEach((p) => prixById.set(p.id, Number(p.prix)));
  const total = parsed.data.items.reduce((acc, it) => acc + (prixById.get(it.repas_id) ?? 0) * it.quantite, 0);

  const created = await prisma.commande.create({
    data: {
      utilisateur_id: session.user?.email ? undefined : undefined,
      table_numero: parsed.data.table_numero,
      total,
      details_commande: {
        create: parsed.data.items.map((it) => ({ repas_id: it.repas_id, quantite: it.quantite, prix_total: (prixById.get(it.repas_id) ?? 0) * it.quantite })),
      },
    },
    include: { details_commande: true },
  });
  return NextResponse.json(created, { status: 201 });
}


