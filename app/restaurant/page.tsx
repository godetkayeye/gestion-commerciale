import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "CAISSIER", "SERVEUR"]);

export default async function RestaurantPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");
  const recettesJour = await prisma.paiement.aggregate({ _sum: { montant: true }, where: { module: "RESTAURANT", date_paiement: { gte: new Date(new Date().toDateString()) } } });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Restaurant — Tableau de bord</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="text-sm text-gray-500">Recettes (jour)</div>
          <div className="mt-1 text-2xl font-semibold text-blue-700">{Number(recettesJour._sum.montant ?? 0).toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}


