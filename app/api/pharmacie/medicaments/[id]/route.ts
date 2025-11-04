import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const allowed = new Set(["ADMIN", "GERANT_PHARMACIE", "PHARMACIEN"]);

const MedicamentSchema = z.object({
  nom: z.string().min(1),
  categorie_id: z.number().int().optional().nullable(),
  prix_unitaire: z.number().nonnegative(),
  quantite_stock: z.number().int().nonnegative(),
  date_expiration: z.string().optional().nullable(),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const id = Number(params.id);
  const body = await req.json();
  const parsed = MedicamentSchema.safeParse({
    ...body,
    prix_unitaire: Number(body?.prix_unitaire),
    quantite_stock: Number(body?.quantite_stock),
    categorie_id: body?.categorie_id ? Number(body.categorie_id) : null,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { nom, categorie_id, prix_unitaire, quantite_stock, date_expiration } = parsed.data;
  const updated = await prisma.medicament.update({
    where: { id },
    data: {
      nom,
      categorie_id: categorie_id ?? null,
      prix_unitaire,
      quantite_stock,
      date_expiration: date_expiration ? new Date(date_expiration) : null,
    },
  });
  return NextResponse.json(updated);
}

const allowedDelete = new Set(["ADMIN"]); // Seul l'admin peut supprimer

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowedDelete.has(session.user.role)) {
    return NextResponse.json(
      { error: "Seul un administrateur peut supprimer un produit" },
      { status: 403 }
    );
  }

  try {
    // Debug: s'assurer que params contient bien l'id
    console.log('[medicaments][DELETE] params:', params);

    if (!params || !params.id) {
      return NextResponse.json({ error: 'Paramètre id manquant' }, { status: 400 });
    }

    const id = Number(params.id);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'Paramètre id invalide' }, { status: 400 });
    }
    
    // Vérifier si le produit existe
    const produit = await prisma.medicament.findUnique({
      where: { id },
    });

    if (!produit) {
      return NextResponse.json(
        { error: "Produit non trouvé" },
        { status: 404 }
      );
    }

    // Supprimer le produit
    await prisma.medicament.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Log détaillé côté serveur pour debugging
    console.error('[medicaments][DELETE] Erreur lors de la suppression:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
    });

    // Retourner le message d'erreur (utile pour debug; on peut rendre plus générique en prod)
    return NextResponse.json(
      { error: error?.message || "Erreur lors de la suppression du produit" },
      { status: 500 }
    );
  }
}


