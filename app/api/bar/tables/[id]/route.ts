import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR", "BAR", "MANAGER_MULTI"]);

const TableSchema = z.object({
  nom: z.string().min(1),
  capacite: z.number().int().nonnegative().optional().default(0),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const resolvedParams = params instanceof Promise ? await params : params;
  const id = Number(resolvedParams.id);
  const body = await req.json();
  const parsed = TableSchema.safeParse({
    ...body,
    capacite: Number(body?.capacite ?? 0),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const updated = await prisma.tables_service.update({ where: { id }, data: parsed.data as any });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const resolvedParams = params instanceof Promise ? await params : params;
  const id = Number(resolvedParams.id);
  await prisma.tables_service.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

