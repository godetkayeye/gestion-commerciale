import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RepasClient from "./RepasClient";
import { getDateRanges } from "@/lib/utils";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR"]);

export default async function RepasPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  const items = await prisma.repas.findMany({ orderBy: { nom: "asc" }, take: 200 });

  const ranges = getDateRanges(new Date());
  // Top dishes this week
  const grouped = await prisma.details_commande.groupBy({
    by: ["repas_id"],
    where: {
      commande: {
        date_commande: {
          gte: ranges.weekly.start,
          lte: ranges.weekly.end,
        },
      },
    },
    _sum: {
      quantite: true,
      prix_total: true,
    },
  });

  const repasIds = grouped.map((g) => g.repas_id).filter((id): id is number => id !== null);
  const repas = await prisma.repas.findMany({ where: { id: { in: repasIds } }, select: { id: true, nom: true } });

  const top = grouped
    .map((g) => ({ id: g.repas_id, nom: repas.find((r) => r.id === g.repas_id)?.nom ?? "Inconnu", quantite: g._sum.quantite ?? 0, total: Number(g._sum.prix_total ?? 0) }))
    .sort((a, b) => b.quantite - a.quantite)
    .slice(0, 10);

  const initial = items.map((c) => ({ id: c.id, nom: c.nom, prix: Number(c.prix), disponible: Boolean(c.disponible) }));

  return (
    <div className="space-y-6">
      <RepasClient initial={initial} top={top} />
    </div>
  );
}


