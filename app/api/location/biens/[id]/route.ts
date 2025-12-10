import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { convertDecimalToNumber } from "@/lib/convertDecimal";
import { ensureBiensExtendedColumns } from "../utils";

const allowed = new Set(["ADMIN", "MANAGER_MULTI"]);
const allowedTypes = ["APPARTEMENT", "LOCAL_COMMERCIAL"] as const;
const niveauValues = ["REZ_DE_CHAUSSEE", "N1", "N2", "N3", "N4"] as const;

const UpdateSchema = z
  .object({
    type: z.enum(allowedTypes).optional(),
    nom: z.string().min(2).optional(),
    niveau: z.enum(niveauValues).optional(),
    adresse: z.string().min(1).optional(),
    superficie: z.number().positive().optional(),
    prix_mensuel: z.number().nonnegative().optional(),
    nombre_pieces: z.number().int().positive().optional(),
    description: z.string().nullable().optional(),
    etat: z.enum(["LIBRE", "OCCUPE", "MAINTENANCE"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Aucune donnée fournie" });

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

function parseId(raw: string | string[] | undefined): number | null {
  if (!raw) return null;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) return null;
  return parsed;
}

export async function GET(_req: NextRequest, context: RouteContext) {
  await ensureBiensExtendedColumns();
  const params = await context.params;
  const id = parseId(params?.id);
  if (!id) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }
  const bien = await prisma.biens.findUnique({ where: { id } });
  if (!bien) {
    return NextResponse.json({ error: "Bien introuvable" }, { status: 404 });
  }
  return NextResponse.json(convertDecimalToNumber(bien));
}

export async function PUT(req: NextRequest, context: RouteContext) {
  await ensureBiensExtendedColumns();
  const params = await context.params;
  const id = parseId(params?.id);
  if (!id) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const target = await prisma.biens.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "Bien introuvable" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = UpdateSchema.safeParse({
    ...body,
    superficie: body?.superficie ? Number(body.superficie) : undefined,
    prix_mensuel: body?.prix_mensuel ? Number(body.prix_mensuel) : undefined,
    nombre_pieces: body?.nombre_pieces ? Number(body.nombre_pieces) : undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data: any = parsed.data;
  if (!data.adresse && data.nom) {
    data.adresse = data.nom;
  }

  try {
    const updated = await prisma.biens.update({
      where: { id },
      data: data as any,
    });
    return NextResponse.json(convertDecimalToNumber(updated));
  } catch (error: any) {
    console.error("[biens][PUT]", error);
    return NextResponse.json({ error: "Mise à jour impossible", details: error?.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  await ensureBiensExtendedColumns();
  const params = await context.params;
  const id = parseId(params?.id);
  if (!id) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    await prisma.biens.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[biens][DELETE]", error);
    return NextResponse.json({ error: "Suppression impossible", details: error?.message }, { status: 500 });
  }
}

