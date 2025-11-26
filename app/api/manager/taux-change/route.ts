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
    console.error("[taux-change][GET] Erreur:", {
      message: error?.message,
      code: error?.code,
    });
    
    // Si la table n'existe pas, retourner la valeur par défaut
    if (error?.message?.includes("does not exist") || error?.code === "P2021") {
      console.warn("[taux-change][GET] Table configuration non trouvée, utilisation de la valeur par défaut");
      return NextResponse.json({ taux_change: 2200 }, { status: 200 });
    }
    
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
    console.log("[taux-change][PUT] Body reçu:", body);
    
    const parsed = TauxChangeSchema.safeParse(body);
    
    if (!parsed.success) {
      console.error("[taux-change][PUT] Validation échouée:", parsed.error.flatten());
      return NextResponse.json({ 
        error: "Données invalides", 
        details: parsed.error.flatten() 
      }, { status: 400 });
    }

    console.log("[taux-change][PUT] Données validées:", parsed.data);

    // Créer ou mettre à jour la configuration
    const config = await prisma.configuration.upsert({
      where: { cle: "taux_change" },
      update: { valeur: String(parsed.data.taux_change) },
      create: { cle: "taux_change", valeur: String(parsed.data.taux_change) },
    });

    console.log("[taux-change][PUT] Configuration mise à jour:", config);

    return NextResponse.json({ 
      taux_change: Number(config.valeur),
      message: "Taux de change mis à jour avec succès"
    });
  } catch (error: any) {
    console.error("[taux-change][PUT] Erreur complète:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    });
    
    // Vérifier si c'est une erreur de table manquante
    if (error?.message?.includes("does not exist") || error?.code === "P2021") {
      return NextResponse.json(
        { 
          error: "La table configuration n'existe pas dans la base de données",
          details: "Veuillez exécuter le script SQL de migration: prisma/migrations/add_configuration_table.sql"
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Impossible de mettre à jour le taux de change", 
        details: error?.message || "Erreur inconnue",
        code: error?.code || "UNKNOWN"
      },
      { status: 500 }
    );
  }
}

