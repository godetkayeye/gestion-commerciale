import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "CAISSIER", "BAR"]);

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const resolvedParams = params instanceof Promise ? await params : params;
  const id = Number(resolvedParams.id);
  const commande = await prisma.commandes_bar.findUnique({
    where: { id },
    include: { details: { include: { boisson: true } } },
  });
  if (!commande) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  if (commande.status !== "EN_COURS") {
    return NextResponse.json({ error: "La commande doit être en cours pour être facturée" }, { status: 400 });
  }

  const total = commande.details.reduce((acc, d) => acc + Number(d.prix_total), 0);
  const taxes = total * 0.18;
  const totalAvecTaxes = total + taxes;

  const facture = await prisma.factures.create({
    data: { commande_id: id, total: totalAvecTaxes, taxes },
  });
  await prisma.commandes_bar.update({ where: { id }, data: { status: "VALIDEE" as any } });

  return NextResponse.json({ ok: true, facture_id: facture.id, total: totalAvecTaxes, taxes });
}
