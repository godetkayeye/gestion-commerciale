import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR", "CAISSIER"]);

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  const resolvedParams = params instanceof Promise ? await params : params;
  const id = Number(resolvedParams.id);
  const body = await req.json().catch(() => ({}));
  const statut = body?.statut as string | undefined;
  if (!statut) return NextResponse.json({ error: "statut requis" }, { status: 400 });
  const updated = await prisma.commande.update({ where: { id }, data: { statut: statut as any } });
  return NextResponse.json(updated);
}


