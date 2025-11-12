import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const allowed = new Set(["ADMIN", "GERANT_PHARMACIE", "CAISSIER", "PHARMACIEN"]);

export default async function ProduitsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  const produits = await prisma.medicament.findMany({ orderBy: { nom: "asc" }, take: 100 });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Produits (Pharmacie)</h1>
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-800">Liste</h2>
        <Link href="/pharmacie/produits/nouveau" className="px-3 py-2 bg-blue-600 text-white rounded text-sm">Nouveau produit</Link>
      </div>
      <div className="rounded-lg border bg-white overflow-hidden mt-2">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="text-left p-2">Nom</th>
              <th className="text-left p-2">Prix</th>
              <th className="text-left p-2">Stock</th>
              <th className="text-left p-2">Expiration</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {produits.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-2">{p.nom}</td>
                <td className="p-2">{Number(p.prix_unitaire).toFixed(2)}</td>
                <td className="p-2">{p.quantite_stock}</td>
                <td className="p-2">{p.date_expiration ? new Date(p.date_expiration).toLocaleDateString() : "-"}</td>
                <td className="p-2">
                  <Link className="text-blue-600" href={`/pharmacie/produits/${p.id}`}>Éditer</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


