import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR", "BAR"]);

const PersonnelSchema = z.object({
  nom: z.string().min(1),
  role: z.enum(["SERVEUR", "BARMAN"]),
});

export async function GET() {
  const items = await prisma.personnel.findMany({ orderBy: { nom: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const body = await req.json();
  const parsed = PersonnelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const created = await prisma.personnel.create({ data: parsed.data });
  return NextResponse.json(created, { status: 201 });
}

