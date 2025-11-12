import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

const allowed = new Set(["ADMIN", "GERANT_PHARMACIE", "CAISSIER", "PHARMACIEN"]);

export default async function PharmaciePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");
  const lowStock = await prisma.medicament.findMany({ where: { quantite_stock: { lte: 5 } }, take: 5 });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Pharmacie — Tableau de bord</h1>
      <div className="rounded-lg border bg-white p-4">
        <div className="font-medium text-gray-800 mb-2">Alertes stock faible</div>
        {lowStock.length === 0 ? (
          <div className="text-sm text-gray-500">Aucune alerte.</div>
        ) : (
          <ul className="text-sm text-gray-700 list-disc pl-5">
            {lowStock.map((m) => (
              <li key={m.id}>{m.nom} — stock: {m.quantite_stock}</li>
            ))}
          </ul>
        )}
      </div>
      <Link className="inline-block px-3 py-2 bg-blue-600 text-white rounded" href="/pharmacie/produits">Gérer les produits</Link>
    </div>
  );
}


