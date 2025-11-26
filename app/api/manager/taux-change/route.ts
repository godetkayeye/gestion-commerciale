import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const allowed = new Set(["ADMIN", "MANAGER_MULTI"]);

const TauxChangeSchema = z.object({
  taux_change: z.number().positive().min(1),
});

export async function GET() {
  try {
    const config = await prisma.configuration.findUnique({
      where: { cle: "taux_change" },
    });
    
    // Valeur par défaut si pas encore configuré
    const taux = config ? Number(config.valeur) : 2200;
    
    return NextResponse.json({ taux_change: taux });
  } catch (error: any) {
    console.error("[taux-change][GET]", error);
    return NextResponse.json({ taux_change: 2200 }, { status: 200 }); // Fallback
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = TauxChangeSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Créer ou mettre à jour la configuration
    const config = await prisma.configuration.upsert({
      where: { cle: "taux_change" },
      update: { valeur: String(parsed.data.taux_change) },
      create: { cle: "taux_change", valeur: String(parsed.data.taux_change) },
    });

    return NextResponse.json({ 
      taux_change: Number(config.valeur),
      message: "Taux de change mis à jour avec succès"
    });
  } catch (error: any) {
    console.error("[taux-change][PUT]", error);
    return NextResponse.json(
      { error: "Impossible de mettre à jour le taux de change", details: error?.message },
      { status: 500 }
    );
  }
}

