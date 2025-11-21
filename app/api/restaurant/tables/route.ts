import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const allowed = new Set(["ADMIN", "CAISSE_RESTAURANT", "CAISSIER", "MANAGER_MULTI"]);

const TableSchema = z.object({
  numero: z.string().min(1),
  capacite: z.number().int().min(1).optional().default(1),
  statut: z.enum(["LIBRE", "OCCUPEE", "EN_ATTENTE"]).optional().default("LIBRE"),
});

export async function GET() {
  const items = await prisma.table_restaurant.findMany({ orderBy: { numero: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = TableSchema.safeParse({
    ...body,
    capacite: body?.capacite ? Number(body.capacite) : undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const created = await prisma.table_restaurant.create({ data: parsed.data as any });
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}