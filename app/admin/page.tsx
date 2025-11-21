import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import CreateUserModal from "./components/CreateUserModal";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (session.user?.role !== "ADMIN") redirect("/");
  
  const [ventePharmaJour, ventesPharmaMois, recettesRestaurantJour, ventesRecentes, utilisateursRecents, produitsStockBas] = await Promise.all([
    prisma.vente_pharmacie.aggregate({ _sum: { total: true }, where: { date_vente: { gte: new Date(new Date().toDateString()) } } }),
    prisma.vente_pharmacie.aggregate({ _sum: { total: true }, where: { date_vente: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
    prisma.paiement.aggregate({ _sum: { montant: true }, where: { module: "RESTAURANT", date_paiement: { gte: new Date(new Date().toDateString()) } } }),
    prisma.vente_pharmacie.findMany({ orderBy: { date_vente: "desc" }, take: 5, include: { details: { include: { medicament: true } } } }),
    prisma.$queryRaw<Array<{ id: number; nom: string; email: string; role: string; date_creation: Date | null }>>`
      SELECT id, nom, email, role, date_creation
      FROM utilisateur
      ORDER BY date_creation DESC
      LIMIT 3
    `,
    prisma.medicament.findMany({ where: { quantite_stock: { lte: 5 } }, take: 5 }),
  ]);

  const kpi = [
    { label: "Ventes Pharmacie (jour)", value: ventePharmaJour._sum.total ?? 0 },
    { label: "Ventes Pharmacie (mois)", value: ventesPharmaMois._sum.total ?? 0 },
    { label: "Recettes Restaurant (jour)", value: recettesRestaurantJour._sum.montant ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Tableau de bord — Admin</h1>
      
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpi.map((x) => (
          <div key={x.label} className="rounded-lg border bg-white p-4">
            <div className="text-sm text-gray-500">{x.label}</div>
            <div className="mt-1 text-2xl font-semibold text-blue-700">{Number(x.value).toFixed(2)} FC</div>
            <div className="text-xs text-gray-400 mt-1">Chiffres en Franc Congolais</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ventes récentes */}
        <div className="rounded-lg border bg-white p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="font-medium text-gray-800">Ventes récentes / Dernières ventes</div>
            <Link href="/pharmacie/ventes" className="text-sm text-blue-600 hover:underline">Voir toutes →</Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">#</th>
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Produits</th>
                <th className="text-left p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {ventesRecentes.map((v, idx) => (
                <tr key={v.id} className="border-t">
                  <td className="p-2">{ventesRecentes.length - idx}</td>
                  <td className="p-2">{v.date_vente ? new Date(v.date_vente).toLocaleString("fr-FR") : "-"}</td>
                  <td className="p-2">
                    {v.details.map((d, i) => (
                      <span key={i}>
                        {d.medicament?.nom ?? "N/A"} x{d.quantite}
                        {i < v.details.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </td>
                  <td className="p-2">{Number(v.total ?? 0).toFixed(2)} FC</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Utilisateurs récents */}
        <div className="rounded-lg border bg-white p-4">
          <div className="font-medium text-gray-800 mb-3">Utilisateurs récents</div>
          <div className="space-y-2">
            {utilisateursRecents.map((u: any) => (
              <div key={u.id} className="flex justify-between items-center p-2 border-b">
                <div>
                  <div className="font-medium">{u.nom}</div>
                  <div className="text-sm text-gray-500">{u.email}</div>
                </div>
                <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{String(u.role).toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Accès rapide */}
        <div className="rounded-lg border bg-white p-4">
          <div className="font-medium text-gray-800 mb-3">Accès rapide</div>
          <div className="flex flex-col gap-2">
            <Link className="px-3 py-2 bg-blue-600 text-white rounded text-sm text-center" href="/pharmacie">Module Pharmacie</Link>
            <Link className="px-3 py-2 bg-blue-600 text-white rounded text-sm text-center" href="/restaurant">Module Restaurant</Link>
            <Link className="px-3 py-2 bg-green-600 text-white rounded text-sm text-center" href="/admin/parametres">Paramètres</Link>
          </div>
        </div>

        {/* Créer un utilisateur */}
        <div className="rounded-lg border bg-white p-4">
          <div className="font-medium text-gray-800 mb-3">Créer un utilisateur</div>
          <CreateUserModal />
        </div>

        {/* Produits en faible stock */}
        <div className="rounded-lg border bg-white p-4">
          <div className="font-medium text-gray-800 mb-3">Produits en faible stock</div>
          {produitsStockBas.length === 0 ? (
            <div className="text-sm text-gray-500">Aucun produit en faible stock.</div>
          ) : (
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
              {produitsStockBas.map((p) => (
                <li key={p.id}>{p.nom} — stock: {p.quantite_stock}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}


