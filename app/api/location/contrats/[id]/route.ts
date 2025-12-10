import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { convertDecimalToNumber } from "@/lib/convertDecimal";

const allowed = new Set(["ADMIN", "MANAGER_MULTI", "CAISSE_LOCATION"]);

const ContratSchema = z.object({
  bien_id: z.number().int(),
  locataire_id: z.number().int(),
  date_debut: z.string(),
  date_fin: z.string(),
  depot_garantie: z.number().optional().nullable(),
  avance: z.number().optional().nullable(),
  statut: z.enum(["ACTIF", "TERMINE", "EN_ATTENTE"]).optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  // Gérer le cas où params peut être une Promise (Next.js 15+)
  const resolvedParams = params instanceof Promise ? await params : params;
  const id = Number(resolvedParams.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }
  
  const contrat = await prisma.contrats.findUnique({
    where: { id },
    include: {
      bien: true,
      locataire: true,
      paiements: {
        orderBy: { date_paiement: "desc" }
      }
    }
  });
  
  if (!contrat) {
    return NextResponse.json({ error: "Contrat introuvable" }, { status: 404 });
  }
  
  return NextResponse.json(convertDecimalToNumber(contrat));
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  // Gérer le cas où params peut être une Promise (Next.js 15+)
  const resolvedParams = params instanceof Promise ? await params : params;
  const id = Number(resolvedParams.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }
  
  const body = await req.json();
  const parsed = ContratSchema.safeParse({
    ...body,
    bien_id: Number(body?.bien_id),
    locataire_id: Number(body?.locataire_id),
    depot_garantie: body?.depot_garantie ? Number(body.depot_garantie) : null,
    avance: body?.avance ? Number(body.avance) : null,
  });
  
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const contrat = await prisma.contrats.findUnique({ where: { id } });
  if (!contrat) {
    return NextResponse.json({ error: "Contrat introuvable" }, { status: 404 });
  }

  // Mettre à jour l'état du bien si le statut change
  if (parsed.data.statut && parsed.data.statut !== (contrat.statut as any)) {
    if (parsed.data.statut === "ACTIF") {
      await prisma.biens.update({ where: { id: parsed.data.bien_id }, data: { etat: "OCCUPE" as any } });
    } else if (parsed.data.statut === "TERMINE") {
      await prisma.biens.update({ where: { id: parsed.data.bien_id }, data: { etat: "LIBRE" as any } });
    }
  }

  const updated = await prisma.contrats.update({
    where: { id },
    data: {
      bien_id: parsed.data.bien_id,
      locataire_id: parsed.data.locataire_id,
      date_debut: new Date(parsed.data.date_debut),
      date_fin: new Date(parsed.data.date_fin),
      depot_garantie: parsed.data.depot_garantie,
      avance: parsed.data.avance,
      statut: parsed.data.statut as any,
    },
  });
  
  return NextResponse.json(convertDecimalToNumber(updated));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  // Gérer le cas où params peut être une Promise (Next.js 15+)
  const resolvedParams = params instanceof Promise ? await params : params;
  const id = Number(resolvedParams.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }
  
  const contrat = await prisma.contrats.findUnique({ where: { id }, include: { paiements: true } });
  if (!contrat) {
    return NextResponse.json({ error: "Contrat introuvable" }, { status: 404 });
  }
  
  // Vérifier s'il y a des paiements
  if (contrat.paiements.length > 0) {
    return NextResponse.json({ error: "Impossible de supprimer : ce contrat a des paiements associés" }, { status: 400 });
  }

  // Libérer le bien
  if (contrat.bien_id) {
    await prisma.biens.update({ where: { id: contrat.bien_id }, data: { etat: "LIBRE" as any } });
  }

  await prisma.contrats.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

