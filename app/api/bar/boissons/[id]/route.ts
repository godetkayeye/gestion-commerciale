import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { convertDecimalToNumber } from "@/lib/convertDecimal";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR", "BAR", "MANAGER_MULTI"]);

const BoissonSchema = z.object({
  nom: z.string().min(1),
  categorie_id: z.number().int().optional().nullable(),
  prix_achat: z.number().nonnegative(),
  prix_vente: z.number().nonnegative(),
  prix_verre: z.number().nonnegative().optional().nullable(),
  stock: z.number().nonnegative(), // Permet les valeurs décimales (ex: 0.7 bouteille)
  unite_mesure: z.string().optional().default("unités"),
  vente_en_bouteille: z.boolean().optional().default(true),
  vente_en_verre: z.boolean().optional().default(false),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const resolvedParams = params instanceof Promise ? await params : params;
  const id = Number(resolvedParams.id);
  const body = await req.json();
  const parsed = BoissonSchema.safeParse({
    ...body,
    prix_achat: Number(body?.prix_achat),
    prix_vente: Number(body?.prix_vente),
    prix_verre: body?.prix_verre ? Number(body.prix_verre) : null,
    stock: Number(body?.stock),
    categorie_id: body?.categorie_id ? Number(body.categorie_id) : null,
    vente_en_bouteille: body?.vente_en_bouteille !== undefined ? Boolean(body.vente_en_bouteille) : true,
    vente_en_verre: body?.vente_en_verre !== undefined ? Boolean(body.vente_en_verre) : false,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const updated = await prisma.boissons.update({ where: { id }, data: parsed.data as any });
  return NextResponse.json(convertDecimalToNumber(updated));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = Number(resolvedParams.id);
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
    }

    // Vérifier si la boisson existe
    const boisson = await prisma.boissons.findUnique({ where: { id } });
    if (!boisson) {
      return NextResponse.json({ error: "Boisson introuvable" }, { status: 404 });
    }

    // Vérifier si la boisson est utilisée dans des commandes
    // Utiliser des requêtes SQL brutes pour éviter les problèmes de noms de modèles
    const commandeDetailsRaw = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM commande_details
      WHERE boisson_id = ${id}
    `;
    
    const commandesRestaurantRaw = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM commande_boissons_restaurant
      WHERE boisson_id = ${id}
    `;
    
    const commandeDetailsCount = Number(commandeDetailsRaw[0]?.count || 0);
    const commandesRestaurantCount = Number(commandesRestaurantRaw[0]?.count || 0);
    
    if (commandeDetailsCount > 0 || commandesRestaurantCount > 0) {
      return NextResponse.json({ 
        error: "Impossible de supprimer cette boisson", 
        details: "Cette boisson est utilisée dans des commandes. Veuillez d'abord supprimer ou modifier les commandes associées." 
      }, { status: 400 });
    }

    await prisma.boissons.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[bar/boissons/DELETE]", error);
    
    // Gérer les erreurs de contrainte de clé étrangère
    if (error.code === "P2003") {
      return NextResponse.json({ 
        error: "Impossible de supprimer cette boisson", 
        details: "Cette boisson est utilisée dans d'autres enregistrements. Veuillez d'abord supprimer ou modifier les enregistrements associés." 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: "Erreur serveur", 
      details: error.message || "Erreur inconnue lors de la suppression de la boisson" 
    }, { status: 500 });
  }
}

