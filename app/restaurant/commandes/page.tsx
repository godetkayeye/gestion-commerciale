import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR", "CAISSIER"]);

export default async function CommandesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  const commandes = await prisma.commande.findMany({ orderBy: { date_commande: "desc" }, take: 100 });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Commandes</h1>
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-800">Liste</h2>
        <Link href="/restaurant/commandes/nouvelle" className="px-3 py-2 bg-blue-600 text-white rounded text-sm">Nouvelle commande</Link>
      </div>
      <div className="flex gap-2">
        <a className="px-3 py-2 bg-gray-200 text-gray-800 rounded text-sm" href="/api/exports/rapport/restaurant">Exporter Excel</a>
      </div>
      <div className="rounded-lg border bg-white overflow-hidden mt-2">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="text-left p-2">#</th>
              <th className="text-left p-2">Table</th>
              <th className="text-left p-2">Statut</th>
              <th className="text-left p-2">Total</th>
              <th className="text-left p-2">Actions</th>
              <th className="text-left p-2">Ticket</th>
            </tr>
          </thead>
          <tbody>
            {commandes.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-2">{c.id}</td>
                <td className="p-2">{c.table_numero}</td>
                <td className="p-2">{c.statut}</td>
                <td className="p-2">{Number(c.total ?? 0).toFixed(2)}</td>
                <td className="p-2"><Link className="text-blue-600" href={`/restaurant/commandes/${c.id}`}>Gérer</Link></td>
                <td className="p-2"><a className="text-blue-600" href={`/api/exports/commande/${c.id}`}>PDF</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


