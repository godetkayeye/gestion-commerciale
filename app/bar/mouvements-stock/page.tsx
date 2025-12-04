import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR", "BAR", "MANAGER_MULTI", "ECONOMAT", "SUPERVISEUR"]);

export default async function MouvementsStockPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  const mouvements = await prisma.mouvements_stock.findMany({
    orderBy: { date_mouvement: "desc" },
    include: { boisson: true },
    take: 500,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Historique des mouvements de stock</h1>
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-blue-50 border-b border-gray-200">
            <tr>
              <th className="text-left p-4 text-sm font-semibold text-gray-900">Date</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-900">Boisson</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-900">Type</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-900">Quantité</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mouvements.map((m, idx) => (
              <tr key={m.id} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                <td className="p-4">
                  <span className="text-gray-800 text-sm">
                    {m.date_mouvement ? new Date(m.date_mouvement).toLocaleString("fr-FR") : "-"}
                  </span>
                </td>
                <td className="p-4">
                  <span className="font-medium text-gray-900">{m.boisson?.nom ?? "N/A"}</span>
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    m.type === "ENTREE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {m.type === "ENTREE" ? "Entrée" : "Sortie"}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`font-semibold ${m.type === "ENTREE" ? "text-green-700" : "text-red-700"}`}>
                    {m.type === "ENTREE" ? "+" : "-"}{Number(m.quantite).toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {mouvements.length === 0 && (
          <div className="p-8 text-center text-gray-500">Aucun mouvement de stock enregistré.</div>
        )}
      </div>
    </div>
  );
}

