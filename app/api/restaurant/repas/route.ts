import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const allowed = new Set(["ADMIN", "CAISSE_RESTAURANT", "CAISSIER", "MANAGER_MULTI"]);

const RepasSchema = z.object({
  nom: z.string().min(1),
  categorie_id: z.number().int().optional().nullable(),
  prix: z.number().nonnegative(),
  disponible: z.boolean().optional().default(true),
});

export async function GET() {
  const items = await prisma.repas.findMany({ orderBy: { nom: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const body = await req.json();
  const parsed = RepasSchema.safeParse({
    ...body,
    prix: Number(body?.prix),
    categorie_id: body?.categorie_id ? Number(body.categorie_id) : null,
    disponible: Boolean(body?.disponible ?? true),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const created = await prisma.repas.create({ data: parsed.data as any });
  return NextResponse.json(created, { status: 201 });
}


