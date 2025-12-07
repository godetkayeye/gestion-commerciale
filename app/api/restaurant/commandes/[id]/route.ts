import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { convertDecimalToNumber } from "@/lib/convertDecimal";

const allowedGet = new Set(["ADMIN", "CAISSE_RESTAURANT", "CAISSIER", "MANAGER_MULTI", "SUPERVISEUR", "CONSEIL_ADMINISTRATION"]);
const allowedPut = new Set(["ADMIN", "CAISSE_RESTAURANT", "CAISSIER", "MANAGER_MULTI", "SUPERVISEUR"]);
const allowedDelete = new Set(["ADMIN", "CAISSE_RESTAURANT", "CAISSIER", "MANAGER_MULTI", "SUPERVISEUR"]);

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !allowedGet.has(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const id = Number(resolvedParams.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    // Récupérer la commande avec les détails
    const commande = await prisma.commande.findUnique({
      where: { id },
      include: {
        details: {
          include: {
            repas: true,
          },
        },
      },
    });

    if (!commande) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    // Récupérer les boissons depuis les commandes bar liées
    let boissons: any[] = [];
    try {
      // Récupérer les commandes bar liées à cette commande restaurant
      const commandesBar = await prisma.commandes_bar.findMany({
        where: { commande_restaurant_id: id } as any,
        include: {
          details: {
            include: {
              boisson: true,
            },
          },
        },
      });
      
      // Extraire toutes les boissons de toutes les commandes bar liées
      commandesBar.forEach((cmdBar: any) => {
        if (cmdBar.details && Array.isArray(cmdBar.details)) {
          boissons.push(...cmdBar.details);
        }
      });
      
      console.log(`[API] Boissons trouvées pour commande ${id}:`, boissons.length, boissons);
    } catch (e: any) {
      console.error(`[API] Erreur lors de la récupération des boissons pour commande ${id}:`, {
        message: e?.message,
        code: e?.code,
        error: e
      });
    }

    // Récupérer les informations du serveur, utilisateur et caissier si les colonnes existent
    let serveur = null;
    let utilisateur = null;
    let caissier = null;
    
    try {
      // Vérifier si les colonnes existent en accédant à la propriété
      const commandeAny = commande as any;
      if (commandeAny.serveur_id) {
        const serveurs = await prisma.$queryRaw<Array<{ id: number; nom: string }>>`
          SELECT id, nom
          FROM personnel
          WHERE id = ${commandeAny.serveur_id}
          LIMIT 1
        `;
        serveur = serveurs && serveurs.length > 0 ? { ...serveurs[0], email: "" } : null;
      }
      if (commandeAny.utilisateur_id) {
        const utilisateurs = await prisma.$queryRaw<Array<{ id: number; nom: string; email: string }>>`
          SELECT id, nom, email
          FROM utilisateur
          WHERE id = ${commandeAny.utilisateur_id}
          LIMIT 1
        `;
        utilisateur = utilisateurs && utilisateurs.length > 0 ? utilisateurs[0] : null;
      }
      if (commandeAny.caissier_id) {
        const caissiers = await prisma.$queryRaw<Array<{ id: number; nom: string; email: string }>>`
          SELECT id, nom, email
          FROM utilisateur
          WHERE id = ${commandeAny.caissier_id}
          LIMIT 1
        `;
        caissier = caissiers && caissiers.length > 0 ? caissiers[0] : null;
      }
    } catch (e) {
      // Les colonnes n'existent peut-être pas encore
      console.log("Colonnes serveur_id/utilisateur_id/caissier_id non disponibles:", e);
    }

    // Ajouter les informations du serveur, utilisateur, caissier et boissons à la réponse
    const commandeWithRelations = {
      ...commande,
      serveur,
      utilisateur,
      caissier,
      boissons: boissons || [], // S'assurer que boissons est toujours un tableau
    };

    console.log(`[API] Commande ${id} - Plats: ${commande.details?.length || 0}, Boissons: ${boissons?.length || 0}`);
    console.log(`[API] Commande ${id} - Données complètes:`, {
      id: commandeWithRelations.id,
      total: commandeWithRelations.total,
      detailsCount: commandeWithRelations.details?.length || 0,
      boissonsCount: commandeWithRelations.boissons?.length || 0,
      boissons: commandeWithRelations.boissons
    });

    return NextResponse.json(convertDecimalToNumber(commandeWithRelations));
  } catch (error: any) {
    console.error("Erreur GET commande:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur serveur lors de la récupération de la commande" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !allowedPut.has(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const id = Number(resolvedParams.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const statut = body?.statut as string | undefined;
    const items = body?.items as Array<{ repas_id: number; quantite: number }> | undefined;
    const items_boissons = body?.items_boissons as Array<{ boisson_id: number; quantite: number }> | undefined;

    // Vérifier que la commande existe
    const commandeExistante = await prisma.commande.findUnique({ where: { id } });
    if (!commandeExistante) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    // Si la commande est payée, on ne peut pas la modifier
    if (commandeExistante.statut === "PAYE") {
      return NextResponse.json({ error: "Impossible de modifier une commande payée" }, { status: 400 });
    }

    // Si on modifie les items (plats ou boissons)
    if (items !== undefined || items_boissons !== undefined) {
      const { getTauxChange } = await import("@/lib/getTauxChange");
      const TAUX_CHANGE = await getTauxChange();
      
      return await prisma.$transaction(async (tx) => {
        // Calculer le total des nouveaux plats
        let totalPlats = 0;
        if (items && items.length > 0) {
          const repasIds = items.map((i) => i.repas_id);
          const plats = await tx.repas.findMany({ where: { id: { in: repasIds } } });
          const prixById = new Map<number, number>();
          plats.forEach((p) => prixById.set(p.id, Number(p.prix)));
          totalPlats = items.reduce((acc, it) => acc + (prixById.get(it.repas_id) ?? 0) * it.quantite, 0);
        }

        // Calculer le total des nouvelles boissons
        let totalBoissons = 0;
        if (items_boissons && items_boissons.length > 0) {
          const boissonIds = items_boissons.map((i) => i.boisson_id);
          const boissons = await tx.boissons.findMany({ where: { id: { in: boissonIds } } });
          const prixBoissonById = new Map<number, number>();
          boissons.forEach((b) => prixBoissonById.set(b.id, Number(b.prix_vente)));
          
          // Vérifier le stock
          for (const it of items_boissons) {
            const boisson = boissons.find((b) => b.id === it.boisson_id);
            if (!boisson) {
              throw new Error(`Boisson #${it.boisson_id} introuvable`);
            }
            // Récupérer les anciennes quantités pour calculer le stock disponible
            const anciennesCommandesBar = await tx.commandes_bar.findMany({
              where: { commande_restaurant_id: id } as any,
              include: { details: true },
            });
            let quantiteAncienne = 0;
            anciennesCommandesBar.forEach((cmdBar: any) => {
              cmdBar.details?.forEach((d: any) => {
                if (d.boisson_id === it.boisson_id) {
                  quantiteAncienne += d.quantite || 0;
                }
              });
            });
            const stockDisponible = Number(boisson.stock || 0) + quantiteAncienne;
            if (stockDisponible < it.quantite) {
              throw new Error(`Stock insuffisant pour ${boisson.nom}. Stock disponible: ${stockDisponible}`);
            }
          }
          
          totalBoissons = items_boissons.reduce((acc, it) => acc + (prixBoissonById.get(it.boisson_id) ?? 0) * it.quantite, 0);
        }

        const totalCombined = totalPlats + totalBoissons;

        // 1. Supprimer les anciens détails de plats
        await tx.details_commande.deleteMany({ where: { commande_id: id } });

        // 2. Supprimer les anciennes commandes bar et restaurer le stock
        const anciennesCommandesBar = await tx.commandes_bar.findMany({
          where: { commande_restaurant_id: id } as any,
          include: { details: true },
        });
        
        for (const cmdBar of anciennesCommandesBar) {
          const cmdBarAny = cmdBar as any;
          if (cmdBarAny.details && Array.isArray(cmdBarAny.details)) {
            // Restaurer le stock pour chaque détail
            for (const detail of cmdBarAny.details) {
              await tx.boissons.update({
                where: { id: detail.boisson_id },
                data: { stock: { increment: detail.quantite || 0 } },
              });
              await tx.mouvements_stock.create({
                data: {
                  boisson_id: detail.boisson_id,
                  type: "ENTREE" as any,
                  quantite: detail.quantite || 0,
                },
              });
            }
            // Supprimer les détails de la commande bar
            await tx.commande_details.deleteMany({
              where: { commande_id: cmdBarAny.id } as any,
            });
          }
        }
        // Supprimer les commandes bar après avoir supprimé leurs détails
        await tx.commandes_bar.deleteMany({ where: { commande_restaurant_id: id } as any });

        // 3. Créer les nouveaux détails de plats
        if (items && items.length > 0) {
          const repasIds = items.map((i) => i.repas_id);
          const plats = await tx.repas.findMany({ where: { id: { in: repasIds } } });
          const prixById = new Map<number, number>();
          plats.forEach((p) => prixById.set(p.id, Number(p.prix)));

          await tx.details_commande.createMany({
            data: items.map((it) => {
              const prixUnitaire = prixById.get(it.repas_id) ?? 0;
              return {
                commande_id: id,
                repas_id: it.repas_id,
                quantite: it.quantite,
                prix_unitaire: prixUnitaire,
                prix_total: prixUnitaire * it.quantite,
              };
            }),
          });
        }

        // 4. Créer les nouvelles commandes bar si nécessaire
        if (items_boissons && items_boissons.length > 0) {
          const boissonIds = items_boissons.map((i) => i.boisson_id);
          const boissons = await tx.boissons.findMany({ where: { id: { in: boissonIds } } });
          const prixBoissonById = new Map<number, number>();
          boissons.forEach((b) => prixBoissonById.set(b.id, Number(b.prix_vente)));

          // Trouver ou créer la table service
          let tableServiceId: number | null = null;
          const commandeAny = commandeExistante as any;
          const tableNumero = commandeAny.table_numero || commandeExistante.table_numero;
          if (tableNumero) {
            const tableService = await tx.tables_service.findFirst({
              where: { nom: String(tableNumero) },
            });
            if (tableService) {
              tableServiceId = tableService.id;
            } else {
              const newTable = await tx.tables_service.create({
                data: {
                  nom: String(tableNumero),
                  capacite: 4,
                },
              });
              tableServiceId = newTable.id;
            }
          }

          const commandeBar = await tx.commandes_bar.create({
            data: {
              table_id: tableServiceId,
              commande_restaurant_id: id,
              date_commande: new Date(),
              status: "EN_COURS" as any,
              details: {
                create: items_boissons.map((it) => {
                  const prixUnitaire = prixBoissonById.get(it.boisson_id) ?? 0;
                  return {
                    boisson_id: it.boisson_id,
                    quantite: it.quantite,
                    prix_total: prixUnitaire * it.quantite,
                  };
                }),
              },
            },
            include: {
              details: { include: { boisson: true } },
            },
          });

          // Décrementer le stock
          for (const it of items_boissons) {
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

        // 5. Mettre à jour le total de la commande
        const updated = await tx.commande.update({
          where: { id },
          data: {
            total: totalCombined,
            total_dollars: totalCombined / TAUX_CHANGE,
          },
          include: {
            details: {
              include: {
                repas: true,
              },
            },
          },
        });

        // 6. Récupérer les boissons mises à jour
        let boissons: any[] = [];
        try {
          const commandesBar = await tx.commandes_bar.findMany({
            where: { commande_restaurant_id: id } as any,
            include: {
              details: {
                include: {
                  boisson: true,
                },
              },
            },
          });
          
          commandesBar.forEach((cmdBar: any) => {
            if (cmdBar.details && Array.isArray(cmdBar.details)) {
              boissons.push(...cmdBar.details);
            }
          });
        } catch (e) {
          console.log("Erreur lors de la récupération des boissons:", e);
        }

        // 7. Récupérer les informations du serveur, utilisateur et caissier
        let serveur = null;
        let utilisateur = null;
        let caissier = null;
        
        try {
          const commandeAny = updated as any;
          if (commandeAny.serveur_id) {
            serveur = await tx.utilisateur.findUnique({
              where: { id: commandeAny.serveur_id },
              select: { id: true, nom: true, email: true },
            });
          }
          if (commandeAny.utilisateur_id) {
            utilisateur = await tx.utilisateur.findUnique({
              where: { id: commandeAny.utilisateur_id },
              select: { id: true, nom: true, email: true },
            });
          }
          if (commandeAny.caissier_id) {
            caissier = await tx.utilisateur.findUnique({
              where: { id: commandeAny.caissier_id },
              select: { id: true, nom: true, email: true },
            });
          }
        } catch (e) {
          console.log("Erreur lors de la récupération du serveur/utilisateur/caissier:", e);
        }

        return {
          ...updated,
          serveur,
          utilisateur,
          caissier,
          boissons: boissons || [],
        };
      }).then((result) => NextResponse.json(convertDecimalToNumber(result)));
    }

    // Si on modifie seulement le statut (comportement original)
    if (!statut) {
      return NextResponse.json({ error: "statut ou items requis" }, { status: 400 });
    }

    // Mettre à jour la commande restaurant et les commandes bar liées dans une transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Mettre à jour la commande restaurant
      const updated = await tx.commande.update({
        where: { id },
        data: { statut: statut as any },
        include: {
          details: {
            include: {
              repas: true,
            },
          },
        },
      });

      // 2. Mettre à jour le statut des commandes bar liées
      // Mapper le statut de la commande restaurant au statut des commandes bar
      // Les commandes bar ont seulement EN_COURS et VALIDEE
      let statutBar: string;
      switch (statut) {
        case "EN_ATTENTE":
        case "EN_PREPARATION":
          statutBar = "EN_COURS";
          break;
        case "SERVI":
        case "PAYE":
          statutBar = "VALIDEE";
          break;
        default:
          statutBar = "EN_COURS";
      }

      try {
        await tx.commandes_bar.updateMany({
          where: { commande_restaurant_id: id } as any,
          data: { status: statutBar as any },
        });
      } catch (e) {
        console.log("Erreur lors de la mise à jour des commandes bar:", e);
        // Continuer même si la mise à jour des commandes bar échoue
      }

      // 3. Récupérer les boissons mises à jour
      let boissons: any[] = [];
      try {
        const commandesBar = await tx.commandes_bar.findMany({
          where: { commande_restaurant_id: id } as any,
          include: {
            details: {
              include: {
                boisson: true,
              },
            },
          },
        });
        
        commandesBar.forEach((cmdBar: any) => {
          if (cmdBar.details && Array.isArray(cmdBar.details)) {
            boissons.push(...cmdBar.details);
          }
        });
      } catch (e) {
        console.log("Erreur lors de la récupération des boissons:", e);
      }

      // 4. Récupérer les informations du serveur, utilisateur et caissier
      let serveur = null;
      let utilisateur = null;
      let caissier = null;
      
      try {
        const commandeAny = updated as any;
        if (commandeAny.serveur_id) {
          const serveurData = await tx.personnel.findUnique({
            where: { id: commandeAny.serveur_id },
            select: { id: true, nom: true },
          });
          serveur = serveurData ? { ...serveurData, email: "" } : null;
        }
        if (commandeAny.utilisateur_id) {
          utilisateur = await tx.utilisateur.findUnique({
            where: { id: commandeAny.utilisateur_id },
            select: { id: true, nom: true, email: true },
          });
        }
        if (commandeAny.caissier_id) {
          caissier = await tx.utilisateur.findUnique({
            where: { id: commandeAny.caissier_id },
            select: { id: true, nom: true, email: true },
          });
        }
      } catch (e) {
        console.log("Erreur lors de la récupération du serveur/utilisateur/caissier:", e);
      }

      return {
        ...updated,
        serveur,
        utilisateur,
        caissier,
        boissons: boissons || [],
      };
    });

    return NextResponse.json(convertDecimalToNumber(result));
  } catch (error: any) {
    console.error("Erreur PUT commande:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur serveur lors de la mise à jour de la commande" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || !allowedDelete.has(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // CAISSE_RESTAURANT n'a pas le droit d'annuler une commande
    if (session.user.role === "CAISSE_RESTAURANT") {
      return NextResponse.json({ error: "Vous n'avez pas le droit d'annuler une commande" }, { status: 403 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const id = Number(resolvedParams.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const commande = await prisma.commande.findUnique({ where: { id } });
    if (!commande) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    // Supprimer les détails d'abord
    await prisma.details_commande.deleteMany({ where: { commande_id: id } });
    // Puis supprimer la commande
    await prisma.commande.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erreur DELETE commande:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur serveur lors de la suppression de la commande" },
      { status: 500 }
    );
  }
}


