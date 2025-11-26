import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { convertDecimalToNumber } from "@/lib/convertDecimal";
import RepasClient from "./RepasClient";
import { REQUIRED_REPAS_CATEGORIES } from "./menuTemplate";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR", "MANAGER_MULTI"]);

export default async function RepasPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  // Calculer la date de début de la semaine (7 jours en arrière)
  const semainePassee = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  semainePassee.setHours(0, 0, 0, 0);

  // S'assurer que les catégories du menu existent
  const categories = await ensureRepasCategories();

  // Récupérer tous les plats
  const itemsRaw = await prisma.repas.findMany({ 
    orderBy: { nom: "asc" }, 
    take: 200 
  });

  // Récupérer les commandes payées/servies de cette semaine pour les plats les plus vendus
  const commandesSemaine = await prisma.commande.findMany({
    where: {
      date_commande: { gte: semainePassee },
      statut: { in: ["PAYE", "SERVI"] as any }
    },
    include: {
      details: {
        include: {
          repas: true
        }
      }
    }
  });

  // Grouper les plats vendus manuellement
  const platsMap = new Map<number, { id: number; nom: string; quantite: number; total: number }>();
  
  commandesSemaine.forEach(commande => {
    commande.details.forEach(detail => {
      if (detail.repas_id && detail.repas) {
        const repasId = detail.repas_id;
        const existing = platsMap.get(repasId);
        if (existing) {
          existing.quantite += detail.quantite;
          existing.total += Number(detail.prix_total);
        } else {
          platsMap.set(repasId, {
            id: repasId,
            nom: detail.repas.nom,
            quantite: detail.quantite,
            total: Number(detail.prix_total),
          });
        }
      }
    });
  });

  // Trier par quantité vendue et prendre les premiers
  const topPlats = Array.from(platsMap.values())
    .sort((a, b) => b.quantite - a.quantite)
    .slice(0, 10);

  const items = convertDecimalToNumber(itemsRaw);

  return <RepasClient initial={items} top={topPlats} categories={categories} />;
}

async function ensureRepasCategories() {
  const existing = await prisma.categorie_repas.findMany();
  const existingNames = new Set(existing.map((c) => c.nom.toLowerCase().trim()));
  const missing = REQUIRED_REPAS_CATEGORIES.filter((name) => !existingNames.has(name.toLowerCase().trim()));

  for (const name of missing) {
    await prisma.categorie_repas.create({ data: { nom: name } });
  }

  return prisma.categorie_repas.findMany({ orderBy: { nom: "asc" } });
}
