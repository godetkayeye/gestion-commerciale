import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const allowed = new Set(["ADMIN", "GERANT_PHARMACIE", "CAISSIER", "PHARMACIEN"]);

export default async function VentesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  const ventes = await prisma.vente_pharmacie.findMany({ orderBy: { date_vente: "desc" }, take: 100 });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Ventes (Pharmacie)</h1>
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-800">Liste</h2>
        <Link href="/pharmacie/ventes/nouvelle" className="px-3 py-2 bg-blue-600 text-white rounded text-sm">Nouvelle vente</Link>
      </div>
      <div className="flex gap-2">
        <a className="px-3 py-2 bg-gray-200 text-gray-800 rounded text-sm" href="/api/exports/rapport/pharmacie">Exporter Excel</a>
      </div>
      <div className="rounded-lg border bg-white overflow-hidden mt-2">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="text-left p-2">#</th>
              <th className="text-left p-2">Date</th>
              <th className="text-left p-2">Total</th>
              <th className="text-left p-2">Ticket</th>
            </tr>
          </thead>
          <tbody>
            {ventes.map((v) => (
              <tr key={v.id} className="border-t">
                <td className="p-2">{v.id}</td>
                <td className="p-2">{v.date_vente ? new Date(v.date_vente).toLocaleString() : ""}</td>
                <td className="p-2">{Number(v.total ?? 0).toFixed(2)}</td>
                <td className="p-2"><a className="text-blue-600" href={`/api/exports/vente/${v.id}`}>PDF</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


