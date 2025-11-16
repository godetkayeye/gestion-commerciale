import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { convertDecimalToNumber } from "@/lib/convertDecimal";

const allowed = new Set(["ADMIN", "MANAGER_MULTI"]);

const BienSchema = z.object({
  type: z.enum(["APPARTEMENT", "BUREAU", "LOCAL_COMMERCIAL", "AUTRE"]),
  adresse: z.string().min(1),
  superficie: z.number().nonnegative(),
  prix_mensuel: z.number().nonnegative(),
  description: z.string().optional().nullable(),
  etat: z.enum(["LIBRE", "OCCUPE", "MAINTENANCE"]).optional().default("LIBRE"),
});

export async function GET() {
  const itemsRaw = await prisma.biens.findMany({ orderBy: { adresse: "asc" }, include: { contrats: { where: { statut: "ACTIF" as any } } } });
  const items = convertDecimalToNumber(itemsRaw);
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const body = await req.json();
  const parsed = BienSchema.safeParse({
    ...body,
    superficie: Number(body?.superficie),
    prix_mensuel: Number(body?.prix_mensuel),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const created = await prisma.biens.create({ data: parsed.data });
  return NextResponse.json(created, { status: 201 });
}

