import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { convertDecimalToNumber } from "@/lib/convertDecimal";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR", "CAISSIER", "BAR"]);

const UpdateCommandeSchema = z.object({
  status: z.enum(["EN_COURS", "VALIDEE", "ANNULEE"]).optional(),
  table_id: z.number().int().nullable().optional(),
  serveur_id: z.number().int().nullable().optional(),
  items: z.array(z.object({ boisson_id: z.number().int(), quantite: z.number().int().positive() })).optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    // Gérer le cas où params peut être une Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params;
    const id = Number(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }
    
    const commande = await prisma.commandes_bar.findUnique({
      where: { id },
      include: { 
        table: true, 
        serveur: true, 
        details: { include: { boisson: true } }, 
        facture: true 
      },
    });
    
    if (!commande) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }
    
    return NextResponse.json(convertDecimalToNumber(commande));
  } catch (error: any) {
    console.error("Erreur GET commande:", error);
    return NextResponse.json({ 
      error: error?.message || "Erreur serveur lors de la récupération de la commande" 
    }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
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
    const parsed = UpdateCommandeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const commande = await prisma.commandes_bar.findUnique({ where: { id } });
    if (!commande) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }
    
    // Empêcher la modification des articles d'une commande validée
    if (parsed.data.items && parsed.data.items.length > 0 && commande.status === "VALIDEE") {
      return NextResponse.json({ error: "Impossible de modifier les articles d'une commande validée" }, { status: 400 });
    }

    // Construire l'objet de mise à jour
    const updateData: any = {};
    if (parsed.data.status) updateData.status = parsed.data.status as any;
    if (parsed.data.table_id !== undefined) updateData.table_id = parsed.data.table_id;
    if (parsed.data.serveur_id !== undefined) updateData.serveur_id = parsed.data.serveur_id;

    // Si on modifie seulement le statut, la table ou le serveur (sans items)
    if (Object.keys(updateData).length > 0 && !parsed.data.items) {
      // Si le statut passe à VALIDEE, créer automatiquement une facture
      if (parsed.data.status === "VALIDEE" && commande.status !== "VALIDEE") {
        // Récupérer les détails de la commande pour calculer le total
        const details = await prisma.commande_details.findMany({
          where: { commande_id: id },
          include: { boisson: true }
        });
        
        const total = details.reduce((acc, d) => acc + Number(d.prix_total), 0);
        const taxes = total * 0.18; // 18% de taxes
        const totalAvecTaxes = total + taxes;

        // Vérifier si une facture existe déjà
        const factureExistante = await prisma.factures.findUnique({
          where: { commande_id: id }
        });

        if (!factureExistante) {
          // Créer la facture
          await prisma.factures.create({
            data: {
              commande_id: id,
              total: totalAvecTaxes,
              taxes: taxes
            }
          });
        }
      }

      const updated = await prisma.commandes_bar.update({
        where: { id },
        data: updateData,
      });
      return NextResponse.json(convertDecimalToNumber(updated));
    }

    // Mise à jour des items (avec restauration du stock) - seulement si commande non validée
    if (parsed.data.items && parsed.data.items.length > 0) {
    const ids = parsed.data.items.map((i) => i.boisson_id);
    const boissons = await prisma.boissons.findMany({ where: { id: { in: ids } } });
    const prixById = new Map<number, number>();
    boissons.forEach((b) => prixById.set(b.id, Number(b.prix_vente)));

    await prisma.$transaction(async (tx) => {
      // Restaurer le stock des anciens items
      const anciensDetails = await tx.commande_details.findMany({ where: { commande_id: id } });
      for (const d of anciensDetails) {
        await tx.boissons.update({ where: { id: d.boisson_id! }, data: { stock: { increment: d.quantite } } });
        await tx.mouvements_stock.create({ data: { boisson_id: d.boisson_id, type: "ENTREE" as any, quantite: d.quantite } });
      }

      // Supprimer les anciens détails
      await tx.commande_details.deleteMany({ where: { commande_id: id } });

      // Vérifier le stock disponible pour les nouveaux items
      for (const it of parsed.data.items!) {
        const boisson = await tx.boissons.findUnique({ where: { id: it.boisson_id } });
        if (!boisson || Number(boisson.stock) < it.quantite) {
          throw new Error(`Stock insuffisant pour ${boisson?.nom ?? "boisson"} ${it.boisson_id}`);
        }
      }

      // Créer les nouveaux détails et décrementer le stock
      for (const it of parsed.data.items!) {
        await tx.commande_details.create({
          data: {
            commande_id: id,
            boisson_id: it.boisson_id,
            quantite: it.quantite,
            prix_total: (prixById.get(it.boisson_id) ?? 0) * it.quantite,
          },
        });
        await tx.boissons.update({ where: { id: it.boisson_id }, data: { stock: { decrement: it.quantite } } });
        await tx.mouvements_stock.create({ data: { boisson_id: it.boisson_id, type: "SORTIE" as any, quantite: it.quantite } });
      }

      // Mettre à jour table_id et serveur_id si fournis
      const updateDataForItems: any = {};
      if (parsed.data.table_id !== undefined) updateDataForItems.table_id = parsed.data.table_id;
      if (parsed.data.serveur_id !== undefined) updateDataForItems.serveur_id = parsed.data.serveur_id;
      
      // Si le statut passe à VALIDEE, créer automatiquement une facture
      if (parsed.data.status === "VALIDEE" && commande.status !== "VALIDEE") {
        const total = parsed.data.items!.reduce((acc, it) => {
          const prix = prixById.get(it.boisson_id) ?? 0;
          return acc + (prix * it.quantite);
        }, 0);
        const taxes = total * 0.18; // 18% de taxes
        const totalAvecTaxes = total + taxes;

        // Vérifier si une facture existe déjà
        const factureExistante = await tx.factures.findUnique({
          where: { commande_id: id }
        });

        if (!factureExistante) {
          // Créer la facture
          await tx.factures.create({
            data: {
              commande_id: id,
              total: totalAvecTaxes,
              taxes: taxes
            }
          });
        }
        updateDataForItems.status = "VALIDEE" as any;
      } else if (parsed.data.status) {
        updateDataForItems.status = parsed.data.status as any;
      }
      
      if (Object.keys(updateDataForItems).length > 0) {
        await tx.commandes_bar.update({ where: { id }, data: updateDataForItems });
      }
    });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Aucune modification spécifiée" }, { status: 400 });
  } catch (error: any) {
    console.error("Erreur PUT commande:", error);
    return NextResponse.json({ 
      error: error?.message || "Erreur serveur lors de la modification de la commande" 
    }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  // Gérer le cas où params peut être une Promise (Next.js 15+)
  const resolvedParams = params instanceof Promise ? await params : params;
  const id = Number(resolvedParams.id);
  const commande = await prisma.commandes_bar.findUnique({ where: { id } });
  if (!commande) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  if (commande.status === "VALIDEE") {
    return NextResponse.json({ error: "Impossible de supprimer une commande validée" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    const details = await tx.commande_details.findMany({ where: { commande_id: id } });
    for (const d of details) {
      await tx.boissons.update({ where: { id: d.boisson_id! }, data: { stock: { increment: d.quantite } } });
      await tx.mouvements_stock.create({ data: { boisson_id: d.boisson_id, type: "ENTREE" as any, quantite: d.quantite } });
    }
    await tx.commande_details.deleteMany({ where: { commande_id: id } });
    await tx.commandes_bar.delete({ where: { id } });
  });

  return NextResponse.json({ ok: true });
}

