import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

const allowed = new Set(["ADMIN", "GERANT_PHARMACIE", "CAISSIER", "PHARMACIEN"]);

async function ProductsList() {
  // server helper: list recent products
  const recent = await prisma.medicament.findMany({ orderBy: { id: "desc" }, take: 6 });
  return (
    <ul className="space-y-2">
      {recent.map((p) => (
        <li key={p.id} className="flex items-center justify-between">
          <div>
            <div className="font-medium">{p.nom}</div>
            <div className="text-xs text-gray-500">Réf #{p.id} · Prix: {Number(p.prix_unitaire).toFixed(2)} FC</div>
          </div>
          <div className="text-sm text-gray-700">{p.quantite_stock} en stock</div>
        </li>
      ))}
    </ul>
  );
}

export default async function PharmaciePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");
  const [lowStock, totalProductsAgg, totalStockAgg, ventesJourAgg] = await Promise.all([
    prisma.medicament.findMany({ where: { quantite_stock: { lte: 5 } }, orderBy: { quantite_stock: "asc" }, take: 6 }),
    prisma.medicament.aggregate({ _count: { id: true } }),
    prisma.medicament.aggregate({ _sum: { quantite_stock: true } }),
    prisma.vente_pharmacie.aggregate({ _sum: { total: true }, where: { date_vente: { gte: new Date(new Date().toDateString()) } } }),
  ]);

  const totalProducts = totalProductsAgg._count.id ?? 0;
  const totalStock = Number(totalStockAgg._sum.quantite_stock ?? 0);
  const ventesJour = Number(ventesJourAgg._sum.total ?? 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Pharmacie — Tableau de bord</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Produits enregistrés</div>
          <div className="mt-1 text-2xl font-semibold text-blue-700">{totalProducts}</div>
          <div className="text-xs text-gray-400 mt-1">Nombre total de produits</div>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Stock total</div>
          <div className="mt-1 text-2xl font-semibold text-blue-700">{totalStock}</div>
          <div className="text-xs text-gray-400 mt-1">Unités en stock</div>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Ventes aujourd'hui</div>
          <div className="mt-1 text-2xl font-semibold text-blue-700">{ventesJour.toFixed(2)} FC</div>
          <div className="text-xs text-gray-400 mt-1">Chiffre du jour</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <div className="rounded-lg border bg-white p-4">
            <div className="font-medium text-gray-800 mb-2">Alertes stock faible</div>
            {lowStock.length === 0 ? (
              <div className="text-sm text-gray-500">Aucune alerte.</div>
            ) : (
              <ul className="text-sm text-gray-700">
                {lowStock.map((m) => (
                  <li key={m.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div>
                      <div className="font-medium">{m.nom}</div>
                      <div className="text-xs text-gray-500">Référence: #{m.id}</div>
                    </div>
                    <div className="text-sm font-medium text-red-600">{m.quantite_stock} en stock</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-800">Produits récents</div>
                <div className="text-sm text-gray-500">Derniers produits ajoutés</div>
              </div>
              <Link href="/pharmacie/produits" className="text-sm text-blue-600">Voir tous</Link>
            </div>

            <div className="mt-4">
              {/* lightweight products list (limited) */}
              <ProductsList />
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border bg-white p-4">
            <div className="text-sm text-gray-500">Actions rapides</div>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/pharmacie/produits/nouveau" className="px-3 py-2 bg-blue-600 text-white rounded text-sm">Nouveau produit</Link>
              <Link href="/pharmacie/ventes/nouvelle" className="px-3 py-2 bg-green-600 text-white rounded text-sm">Nouvelle vente</Link>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4">
            <div className="text-sm text-gray-500">Raccourcis</div>
            <div className="mt-2 text-sm">
              <Link href="/pharmacie/produits" className="text-blue-600">Gérer produits</Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}


