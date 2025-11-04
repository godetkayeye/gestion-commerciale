import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CreateUserModal from "./components/CreateUserModal";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (session.user?.role !== "ADMIN") redirect("/");
  const [ventePharmaJour, ventesPharmaMois, recettesRestaurantJour] = await Promise.all([
    prisma.vente_pharmacie.aggregate({ _sum: { total: true }, where: { date_vente: { gte: new Date(new Date().toDateString()) } } }),
    prisma.vente_pharmacie.aggregate({ _sum: { total: true }, where: { date_vente: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
    prisma.paiement.aggregate({ _sum: { montant: true }, where: { module: "RESTAURANT", date_paiement: { gte: new Date(new Date().toDateString()) } } }),
  ]);

  const kpi = [
    { label: "Ventes Pharmacie (jour)", value: ventePharmaJour._sum.total ?? 0 },
    { label: "Ventes Pharmacie (mois)", value: ventesPharmaMois._sum.total ?? 0 },
    { label: "Recettes Restaurant (jour)", value: recettesRestaurantJour._sum.montant ?? 0 },
  ];

  return (
    <div className="space-y-6">
  <h1 className="text-2xl font-semibold text-gray-800">Tableau de bord — Admin</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpi.map((x) => (
          <div key={x.label} className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-700">{x.label}</div>
            <div className="mt-1 text-2xl font-semibold text-blue-700">{Number(x.value).toFixed(2)} FC</div>
            <div className="mt-2 text-xs text-gray-700">Chiffres en Franc Congolais</div>
          </div>
        ))}
      </div>
      <DashboardExtras />
    </div>
  );
}

async function DashboardExtras() {
  // server component for extra data
  const [recentVentes, lowStock, users] = await Promise.all([
    // include only medicament fields we actually use (avoid selecting missing columns)
    prisma.vente_pharmacie.findMany({
      orderBy: { date_vente: "desc" },
      take: 6,
      include: { details: { include: { medicament: { select: { id: true, nom: true } } } } },
    }),
    // select only columns that definitely exist in the database to avoid schema drift issues
    prisma.medicament.findMany({
      where: { quantite_stock: { lte: 5 } },
      orderBy: { quantite_stock: "asc" },
      take: 6,
      select: { id: true, nom: true, quantite_stock: true }
    }),
    prisma.utilisateur.findMany({ orderBy: { date_creation: "desc" }, take: 10 }),
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="col-span-2 space-y-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-700">Ventes récentes</div>
              <div className="mt-1 text-lg font-semibold text-gray-800">Dernières ventes</div>
            </div>
            <div className="text-sm text-gray-700">Voir toutes →</div>
          </div>

          <div className="mt-4 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="text-left p-3">#</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Produits</th>
                  <th className="text-left p-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentVentes.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{v.id}</td>
                    <td className="p-3 text-gray-700">{v.date_vente ? new Date(v.date_vente).toLocaleString() : "-"}</td>
                    <td className="p-3 text-gray-700">
                      {v.details && v.details.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {v.details.slice(0, 3).map((d) => (
                            <span key={d.id} className="px-2 py-0.5 bg-gray-100 rounded text-xs">{d.medicament?.nom ?? `Produit #${d.medicament_id ?? ''}`} × {d.quantite}</span>
                          ))}
                          {v.details.length > 3 && <span className="text-xs text-gray-700">+{v.details.length - 3} autres</span>}
                        </div>
                      ) : (
                        <span className="text-gray-700">Aucun détail</span>
                      )}
                    </td>
                    <td className="p-3 font-medium text-blue-700">{Number(v.total ?? 0).toFixed(2)} FC</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-700">Accès rapide</div>
          <div className="mt-3 flex gap-2 flex-wrap">
            <Link className="px-3 py-2 bg-blue-600 text-white rounded" href="/pharmacie">Module Pharmacie</Link>
            <Link className="px-3 py-2 bg-blue-600 text-white rounded" href="/restaurant">Module Restaurant</Link>
            <Link className="px-3 py-2 bg-green-600 text-white rounded" href="/admin">Paramètres</Link>
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
  <div className="text-sm text-gray-700">Utilisateurs récents</div>
          <div className="mt-3 space-y-2">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{u.nom}</div>
                  <div className="text-xs text-gray-700">{u.email}</div>
                </div>
                <div className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">{u.role}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-700">Créer un utilisateur</div>
          <div className="mt-4">
            {/* @ts-expect-error Server->Client prop serialization OK for onSuccessAction */}
            <CreateUserModal onSuccessAction={async () => { 'use server'; await revalidatePath('/admin'); }} />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-700">Produits en faible stock</div>
          <div className="mt-3 space-y-2">
            {lowStock.length === 0 ? (
              <div className="text-sm text-gray-700">Aucun produit critique</div>
            ) : (
              lowStock.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-sm">
                  <div className="font-medium">{m.nom}</div>
                  <div className="text-red-600">{m.quantite_stock}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}


