import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function Page({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const table = await prisma.table_restaurant.findUnique({ where: { id } });
  if (!table) return <div className="p-8">Table non trouvée</div>;

  const commandes = await prisma.commande.findMany({
    where: { table_numero: table.numero },
    orderBy: { date_commande: "desc" },
    include: { details: true },
  });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <nav className="flex items-center gap-1 text-sm text-gray-500 mb-1">
            <Link href="/restaurant/tables" className="hover:text-gray-700">Tables</Link>
            <span>/</span>
            <span className="text-gray-700">Détails</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">Table {table.numero}</h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="text-sm text-gray-700">
              <span className="font-medium">{table.capacite}</span> place{table.capacite > 1 ? 's' : ''}
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-sm font-medium
              ${table.statut?.toLowerCase() === 'libre' ? 'bg-green-50 text-green-700' :
              table.statut?.toLowerCase() === 'occupee' ? 'bg-red-50 text-red-700' :
              'bg-yellow-50 text-yellow-700'}`}>
              {table.statut}
            </span>
          </div>
        </div>
        <div>
          <Link href="/restaurant/tables" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Retour aux tables
          </Link>
        </div>
      </div>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Historique des commandes</h2>
        </div>
        {commandes.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <div className="text-gray-500">Aucune commande pour cette table</div>
            <div className="text-sm text-gray-400 mt-1">Les commandes apparaîtront ici une fois créées</div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {commandes.map((c) => (
              <li key={c.id} className="px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium text-gray-900">Commande #{c.id}</div>
                    <div className="text-sm text-gray-500">{new Date(c.date_commande || '').toLocaleString()}</div>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">{Number(c.total || 0).toFixed(2)} FC</div>
                </div>
                <div className="mt-3 space-y-2">
                  {c.details.map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between text-sm">
                      <div className="text-gray-700">{d.repas_id ? `Repas #${d.repas_id}` : 'Article'}</div>
                      <div className="text-gray-600">
                        <span className="font-medium">x{d.quantite}</span>
                        <span className="mx-2">—</span>
                        <span>{Number(d.prix_total).toFixed(2)} FC</span>
                      </div>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
