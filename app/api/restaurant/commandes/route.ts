import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { convertDecimalToNumber } from "@/lib/convertDecimal";

const allowedGet = new Set(["ADMIN", "CAISSE_RESTAURANT", "CAISSIER", "MANAGER_MULTI", "CONSEIL_ADMINISTRATION", "SUPERVISEUR"]);
const allowedPost = new Set(["ADMIN", "CAISSE_RESTAURANT", "CAISSIER", "MANAGER_MULTI"]);

const ItemSchema = z.object({ repas_id: z.number().int(), quantite: z.number().int().positive() });
const BoissonItemSchema = z.object({ boisson_id: z.number().int(), quantite: z.number().int().positive() });
const CreateSchema = z.object({
  table_numero: z.string().min(1),
  items: z.array(ItemSchema).min(0),
  items_boissons: z.array(BoissonItemSchema).min(0).optional(),
  serveur_id: z.number().int().optional(),
  caissier_id: z.number().int().optional(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowedGet.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    // Récupérer les commandes restaurant (plats)
    const commandesRestaurant = await prisma.commande.findMany({
      orderBy: { date_commande: "desc" },
      take: 100,
      include: {
        details: { include: { repas: true } },
        utilisateur: true,
        serveur: true,
        caissier: true,
      },
    });

    // Pour chaque commande restaurant, récupérer les commandes bar liées (boissons)
    const commandesWithBoissons = await Promise.all(
      commandesRestaurant.map(async (cmd) => {
        let boissons: any[] = [];
        try {
          // Récupérer les commandes bar liées à cette commande restaurant
          const commandesBar = await prisma.commandes_bar.findMany({
            where: { commande_restaurant_id: cmd.id } as any,
            include: {
              details: { include: { boisson: true } },
            },
          });
          
          // Extraire toutes les boissons de toutes les commandes bar liées
          commandesBar.forEach((cmdBar: any) => {
            if (cmdBar.details && Array.isArray(cmdBar.details)) {
              boissons.push(...cmdBar.details);
            }
          });
        } catch (e) {
          console.warn(`Erreur lors de la récupération des boissons pour commande ${cmd.id}:`, e);
        }
        
        return {
          ...cmd,
          boissons,
        };
      })
    );

    return NextResponse.json(convertDecimalToNumber(commandesWithBoissons));
  } catch (error: any) {
    console.error("Erreur lors de la récupération des commandes:", error);
    return NextResponse.json({ error: error?.message || "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !allowedPost.has(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }
    
    const body = await req.json().catch(() => ({}));
    const parsed = CreateSchema.safeParse({
      table_numero: body?.table_numero,
      items: Array.isArray(body?.items)
        ? body.items.map((i: any) => ({ repas_id: Number(i.repas_id), quantite: Number(i.quantite) }))
        : [],
      items_boissons: Array.isArray(body?.items_boissons)
        ? body.items_boissons.map((i: any) => ({ boisson_id: Number(i.boisson_id), quantite: Number(i.quantite) }))
        : [],
      serveur_id: body?.serveur_id ? Number(body.serveur_id) : undefined,
      caissier_id: body?.caissier_id ? Number(body.caissier_id) : undefined,
    });
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Vérifier qu'il y a au moins des plats ou des boissons
    const itemsPlats = (parsed.data.items || []).filter((i: any) => i && i.repas_id);
    const itemsBoissons = (parsed.data.items_boissons || []).filter((i: any) => i && i.boisson_id);
    
    if (itemsPlats.length === 0 && itemsBoissons.length === 0) {
      return NextResponse.json({ error: "Veuillez ajouter au moins un plat ou une boisson" }, { status: 400 });
    }

    // Récupérer l'utilisateur pour obtenir son ID
    const utilisateur = session.user?.email
      ? await prisma.utilisateur.findUnique({ where: { email: session.user.email } })
      : null;

    // Déterminer le serveur : celui fourni dans le body, ou l'utilisateur connecté par défaut
    let serveurId = parsed.data.serveur_id;
    if (!serveurId && utilisateur) {
      serveurId = utilisateur.id;
    }

    // Calculer le total des plats
    const prixById = new Map<number, number>();
    let totalPlats = 0;
    if (itemsPlats.length > 0) {
      const repasIds = itemsPlats.map((i: any) => i.repas_id);
      const plats = await prisma.repas.findMany({ where: { id: { in: repasIds } } });
      plats.forEach((p) => prixById.set(p.id, Number(p.prix)));
      totalPlats = itemsPlats.reduce((acc: number, it: any) => acc + (prixById.get(it.repas_id) ?? 0) * it.quantite, 0);
    }

    // Calculer le total des boissons
    const prixBoissonById = new Map<number, number>();
    let totalBoissons = 0;
    if (itemsBoissons.length > 0) {
      const boissonIds = itemsBoissons.map((i: any) => i.boisson_id);
      const boissons = await prisma.boissons.findMany({ where: { id: { in: boissonIds } } });
      boissons.forEach((b) => prixBoissonById.set(b.id, Number(b.prix_vente)));
      totalBoissons = itemsBoissons.reduce((acc: number, it: any) => acc + (prixBoissonById.get(it.boisson_id) ?? 0) * it.quantite, 0);
      
      // Vérifier le stock
      for (const it of itemsBoissons) {
        const boisson = boissons.find((b) => b.id === it.boisson_id);
        if (!boisson) {
          return NextResponse.json({ error: `Boisson #${it.boisson_id} introuvable` }, { status: 400 });
        }
        const stock = Number(boisson.stock || 0);
        if (stock < it.quantite) {
          return NextResponse.json({ error: `Stock insuffisant pour ${boisson.nom}. Stock disponible: ${stock}` }, { status: 400 });
        }
      }
    }

    // Total général
    const total = totalPlats + totalBoissons;
    
    // Récupérer le taux de change depuis la base de données
    const { getTauxChange } = await import("@/lib/getTauxChange");
    const TAUX_CHANGE = await getTauxChange();
    const totalDollars = total / TAUX_CHANGE;

    // Trouver ou créer la table dans tables_service pour les boissons
    let tableServiceId: number | null = null;
    if (itemsBoissons.length > 0) {
      try {
        // Chercher une table existante avec le même nom
        const tableService = await prisma.tables_service.findFirst({
          where: { nom: parsed.data.table_numero },
        });
        
        if (tableService) {
          tableServiceId = tableService.id;
        } else {
          // Créer une nouvelle table si elle n'existe pas
          const newTable = await prisma.tables_service.create({
            data: {
              nom: parsed.data.table_numero,
              capacite: 4, // Valeur par défaut
            },
          });
          tableServiceId = newTable.id;
        }
      } catch (e) {
        console.warn("Impossible de trouver/créer la table service:", e);
      }
    }

    // Créer les commandes dans une transaction
    const result = await prisma.$transaction(async (tx) => {
      let commandeRestaurant = null;
      let commandeBar = null;

      // 1. Créer la commande restaurant (plats) si il y en a, ou une commande minimale si seulement des boissons
      // On crée toujours une commande restaurant pour maintenir la cohérence et permettre la facture unique
      if (itemsPlats.length > 0 || itemsBoissons.length > 0) {
        // Calculer le total combiné (plats + boissons)
        const totalCombined = totalPlats + totalBoissons;
        
        const commandeData: any = {
          table_numero: parsed.data.table_numero,
          total: totalCombined,
          total_dollars: totalCombined / TAUX_CHANGE,
        };

        // Ajouter les détails seulement s'il y a des plats
        if (itemsPlats.length > 0) {
          commandeData.details = {
            create: itemsPlats.map((it: any) => {
              const prixUnitaire = prixById.get(it.repas_id) ?? 0;
              return {
                repas_id: it.repas_id,
                quantite: it.quantite,
                prix_unitaire: prixUnitaire,
                prix_total: prixUnitaire * it.quantite,
              };
            }),
          };
        }

        // Utiliser directement les IDs scalaires (plus robuste)
        // Prisma accepte les IDs directs même si les relations existent
        if (utilisateur?.id) {
          commandeData.utilisateur_id = utilisateur.id;
        }
        if (serveurId) {
          commandeData.serveur_id = serveurId;
        }
        if (parsed.data.caissier_id) {
          commandeData.caissier_id = parsed.data.caissier_id;
        }

        // Créer la commande avec gestion d'erreur pour les champs optionnels
        // Essayer d'abord avec tous les includes, puis sans caissier si nécessaire
        const includeOptions: any = {
          utilisateur: true,
          serveur: true,
        };
        
        // Ajouter details seulement s'il y a des plats
        if (itemsPlats.length > 0) {
          includeOptions.details = { include: { repas: true } };
        }
        
        // Essayer d'ajouter caissier à l'include seulement si disponible
        try {
          commandeRestaurant = await tx.commande.create({
            data: commandeData,
            include: {
              ...includeOptions,
              caissier: true,
            },
          });
        } catch (createError: any) {
          // Si l'erreur concerne caissier (dans data ou include), essayer sans
          if (createError?.message?.includes("caissier")) {
            console.warn("Erreur avec caissier, tentative sans ce champ:", createError.message);
            // Retirer caissier_id des données si présent
            const commandeDataWithoutCaissier = { ...commandeData };
            delete commandeDataWithoutCaissier.caissier_id;
            
            commandeRestaurant = await tx.commande.create({
              data: commandeDataWithoutCaissier,
              include: includeOptions,
            });
          } else {
            throw createError;
          }
        }
      }

      // 2. Créer la commande bar (boissons) si il y en a
      if (itemsBoissons.length > 0) {
        const commandeBarData: any = {
          table_id: tableServiceId,
          date_commande: new Date(),
          status: "EN_COURS" as any,
          details: {
            create: itemsBoissons.map((it: any) => {
              const prixUnitaire = prixBoissonById.get(it.boisson_id) ?? 0;
              return {
                boisson_id: it.boisson_id,
                quantite: it.quantite,
                prix_total: prixUnitaire * it.quantite,
              };
            }),
          },
        };

        // Lier à la commande restaurant si elle existe
        if (commandeRestaurant) {
          (commandeBarData as any).commande_restaurant_id = commandeRestaurant.id;
        }

        // Si serveur_id existe, trouver le personnel correspondant
        if (serveurId) {
          try {
            const utilisateurServeur = await tx.utilisateur.findUnique({
              where: { id: serveurId },
            });
            if (utilisateurServeur) {
              // Chercher ou créer un personnel avec ce nom
              let personnel = await tx.personnel.findFirst({
                where: { nom: utilisateurServeur.nom },
              });
              if (!personnel) {
                personnel = await tx.personnel.create({
                  data: {
                    nom: utilisateurServeur.nom,
                    role: "SERVEUR" as any,
                  },
                });
              }
              commandeBarData.serveur_id = personnel.id;
            }
          } catch (e) {
            console.warn("Impossible de lier le serveur à la commande bar:", e);
          }
        }

        commandeBar = await tx.commandes_bar.create({
          data: commandeBarData,
          include: {
            details: { include: { boisson: true } },
            table: true,
            serveur: true,
          },
        });

        // Mettre à jour le stock des boissons
        for (const it of itemsBoissons) {
          await tx.boissons.update({
            where: { id: it.boisson_id },
            data: { stock: { decrement: it.quantite } },
          });
          await tx.mouvements_stock.create({
            data: {
              boisson_id: it.boisson_id,
              type: "SORTIE" as any,
              quantite: it.quantite,
            },
          });
        }
      }

      // 3. Retourner la commande principale (restaurant si elle existe, sinon bar)
      if (commandeRestaurant) {
        // Récupérer les boissons de la commande bar liée
        let boissons: any[] = [];
        if (commandeBar && (commandeBar as any).details) {
          boissons = (commandeBar as any).details || [];
        }
        
        return {
          ...commandeRestaurant,
          boissons,
          commande_bar_id: commandeBar?.id,
        };
      } else if (commandeBar) {
        // Si seulement des boissons, retourner la commande bar
        const cmdBarAny = commandeBar as any;
        return {
          id: commandeBar.id,
          table_numero: cmdBarAny.table?.nom || parsed.data.table_numero,
          total: totalBoissons,
          total_dollars: totalBoissons / TAUX_CHANGE,
          statut: "EN_ATTENTE" as any,
          date_commande: commandeBar.date_commande,
          details: [],
          boissons: cmdBarAny.details || [],
          utilisateur: null,
          serveur: cmdBarAny.serveur ? { id: cmdBarAny.serveur.id, nom: cmdBarAny.serveur.nom, email: "" } : null,
          caissier: parsed.data.caissier_id ? await tx.utilisateur.findUnique({ where: { id: parsed.data.caissier_id }, select: { id: true, nom: true, email: true } }) : null,
        };
      }

      throw new Error("Aucune commande créée");
    });

    return NextResponse.json(convertDecimalToNumber(result), { status: 201 });
  } catch (error: any) {
    console.error("Erreur lors de la création de la commande:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur serveur lors de la création de la commande" },
      { status: 500 }
    );
  }
}
