"use client";

interface VentesPersonnelClientProps {
  commandes: any[];
}

export default function VentesPersonnelClient({ commandes }: VentesPersonnelClientProps) {
  if (commandes.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
        Aucune vente enregistrée pour ce membre du personnel
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
      <table className="w-full">
        <thead className="bg-blue-50 border-b border-gray-200">
          <tr>
            <th className="text-left p-4 text-sm font-semibold text-gray-900">Date</th>
            <th className="text-left p-4 text-sm font-semibold text-gray-900">Table</th>
            <th className="text-left p-4 text-sm font-semibold text-gray-900">Articles</th>
            <th className="text-right p-4 text-sm font-semibold text-gray-900">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {commandes.map((cmd, idx) => {
            const totalCommande = cmd.details.reduce((sum: number, d: any) => sum + Number(d.prix_total), 0);
            return (
              <tr key={cmd.id} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                <td className="p-4">
                  <span className="text-gray-900">
                    {new Date(cmd.date_commande).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </td>
                <td className="p-4">
                  <span className="text-gray-800 font-medium">{cmd.table?.nom || "N/A"}</span>
                </td>
                <td className="p-4">
                  <div className="space-y-1">
                    {cmd.details.map((d: any, i: number) => (
                      <div key={i} className="text-sm text-gray-700">
                        {d.boisson?.nom} × {d.quantite} = {Number(d.prix_total).toLocaleString()} FC
                      </div>
                    ))}
                  </div>
                </td>
                <td className="p-4 text-right">
                  <span className="font-bold text-gray-900">{totalCommande.toLocaleString()} FC</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

