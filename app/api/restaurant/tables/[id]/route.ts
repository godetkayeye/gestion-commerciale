import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR"]);

const TableUpdateSchema = z.object({
  numero: z.string().min(1).optional(),
  capacite: z.number().int().min(1).optional(),
  statut: z.enum(["LIBRE", "OCCUPEE", "EN_ATTENTE"]).optional(),
});

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const item = await prisma.table_restaurant.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const id = Number(params.id);
  const body = await req.json();
  const parsed = TableUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try {
    const updated = await prisma.table_restaurant.update({ where: { id }, data: parsed.data as any });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const id = Number(params.id);
  try {
    await prisma.table_restaurant.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
