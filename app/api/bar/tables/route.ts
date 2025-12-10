import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR", "CAISSE_BAR", "BAR", "MANAGER_MULTI"]);

const TableSchema = z.object({
  nom: z.string().min(1),
  capacite: z.number().int().nonnegative().optional().default(0),
});

export async function GET() {
  const items = await prisma.tables_service.findMany({ orderBy: { nom: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const body = await req.json();
  const parsed = TableSchema.safeParse({
    ...body,
    capacite: Number(body?.capacite ?? 0),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const created = await prisma.tables_service.create({ data: parsed.data as any });
  return NextResponse.json(created, { status: 201 });
}
