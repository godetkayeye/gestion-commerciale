import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "CAISSIER"]);

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  const id = Number(params.id);
  const commande = await prisma.commande.findUnique({ where: { id } });
  if (!commande) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  const montant = Number(commande.total ?? 0);
  const paiement = await prisma.paiement.create({ data: { module: "RESTAURANT" as any, reference_id: id, montant, mode_paiement: "CASH" as any } });
  await prisma.commande.update({ where: { id }, data: { statut: "payé" as any } });
  return NextResponse.json({ ok: true, paiement_id: paiement.id });
}


