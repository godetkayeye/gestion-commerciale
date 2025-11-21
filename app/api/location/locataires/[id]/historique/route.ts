import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { convertDecimalToNumber } from "@/lib/convertDecimal";

const allowed = new Set(["ADMIN", "LOCATION", "MANAGER_MULTI"]);

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
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const params = await context.params;
  const id = parseId(params?.id);
  if (!id) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  try {
    const locataire = await prisma.locataires.findUnique({
      where: { id },
      include: {
        contrats: {
          include: {
            bien: true,
            paiements: {
              orderBy: { date_paiement: "desc" },
            },
          },
          orderBy: { date_debut: "desc" },
        },
      },
    });

    if (!locataire) {
      return NextResponse.json({ error: "Locataire introuvable" }, { status: 404 });
    }

    const converted = convertDecimalToNumber(locataire);
    return NextResponse.json(converted);
  } catch (error: any) {
    console.error("[locataires/historique/GET]", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération de l'historique",
        details: error?.message || "Erreur inconnue",
      },
      { status: 500 },
    );
  }
}

