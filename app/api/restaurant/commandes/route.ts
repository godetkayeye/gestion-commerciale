import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR", "CAISSIER"]);

const ItemSchema = z.object({ repas_id: z.number().int(), quantite: z.number().int().positive() });
const CreateSchema = z.object({ table_numero: z.string().min(1), items: z.array(ItemSchema).min(1) });

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const statut = searchParams.get("statut") ?? undefined;
  const commandes = await prisma.commande.findMany({
    where: statut ? { statut: (statut as any) } : undefined,
    orderBy: { date_commande: "desc" },
  });
  return NextResponse.json(commandes);
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !allowed.has(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    console.log('Request body:', body); // Debug log

    const parsed = CreateSchema.safeParse({
      table_numero: body?.table_numero,
      items: Array.isArray(body?.items)
        ? body.items.map((i: any) => ({ repas_id: Number(i.repas_id), quantite: Number(i.quantite) }))
        : [],
    });

    if (!parsed.success) {
      console.log('Validation error:', parsed.error.flatten()); // Debug log
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Vérifier si la table existe
    const table = await prisma.table_restaurant.findUnique({
      where: { numero: parsed.data.table_numero }
    });

    if (!table) {
      return NextResponse.json({ error: `La table ${parsed.data.table_numero} n'existe pas` }, { status: 404 });
    }

    // Calculer le prix total
    const prixById = new Map<number, number>();
    const repasIds = parsed.data.items.map((i) => i.repas_id);
    const plats = await prisma.repas.findMany({ where: { id: { in: repasIds } } });
    
    if (plats.length !== repasIds.length) {
      const foundIds = new Set(plats.map(p => p.id));
      const missingIds = repasIds.filter(id => !foundIds.has(id));
      return NextResponse.json({ 
        error: `Certains repas n'existent pas: ${missingIds.join(', ')}` 
      }, { status: 404 });
    }

    plats.forEach((p) => prixById.set(p.id, Number(p.prix)));
    const total = parsed.data.items.reduce((acc, it) => acc + (prixById.get(it.repas_id) ?? 0) * it.quantite, 0);

  try {
    const created = await prisma.commande.create({
      data: {
        utilisateur_id: null, // On traitera l'authentification plus tard
        table_numero: parsed.data.table_numero,
        total,
        details: {
          create: parsed.data.items.map((it) => ({ 
            repas_id: it.repas_id, 
            quantite: it.quantite, 
            prix_total: (prixById.get(it.repas_id) ?? 0) * it.quantite 
          })),
        },
      },
      include: { details: true },
    });

    // Mettre à jour le statut de la table
    await prisma.table_restaurant.update({
      where: { numero: parsed.data.table_numero },
      data: { statut: 'OCCUPEE' }
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ 
      error: "Une erreur s'est produite lors de la création de la commande",
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
} catch (error) {
  console.error('Request error:', error);
  return NextResponse.json({ 
    error: "Une erreur inattendue s'est produite",
    details: error instanceof Error ? error.message : 'Erreur inconnue'
  }, { status: 500 });
}
}


