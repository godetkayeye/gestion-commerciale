"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function CommandeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [commande, setCommande] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [facturing, setFacturing] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/bar/commandes/${id}`);
      if (!res.ok) {
        setError("Commande introuvable");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setCommande(data);
      setLoading(false);
    })();
  }, [id]);

  const handleFacturer = async () => {
    if (!confirm("Facturer cette commande ?")) return;
    setFacturing(true);
    const res = await fetch(`/api/bar/commandes/${id}/facturer`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      window.open(`/api/exports/facture-bar/${data.facture_id}`, "_blank");
      const res2 = await fetch(`/api/bar/commandes/${id}`);
      if (res2.ok) {
        const data2 = await res2.json();
        setCommande(data2);
      }
    }
    setFacturing(false);
  };

  const handleAnnuler = async () => {
    if (!confirm("Annuler cette commande ? Cette action est irréversible.")) return;
    const res = await fetch(`/api/bar/commandes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ANNULEE" }),
    });
    if (res.ok) router.push("/bar/commandes");
  };

  if (loading) return <div className="text-center p-8 text-gray-600">Chargement...</div>;
  if (error || !commande) return <div className="text-center p-8 text-red-600">{error ?? "Erreur"}</div>;

  const total = commande.details?.reduce((acc: number, d: any) => acc + Number(d.prix_total), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Commande #{commande.id}</h1>
        <Link href="/bar/commandes" className="text-blue-600 hover:underline">← Retour</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Informations</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Table:</span>
              <span className="font-medium text-gray-900">{commande.table?.nom ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Serveur:</span>
              <span className="font-medium text-gray-900">{commande.serveur?.nom ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium text-gray-900">
                {commande.date_commande ? new Date(commande.date_commande).toLocaleString("fr-FR") : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Statut:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                commande.status === "VALIDEE" ? "bg-green-100 text-green-800" :
                commande.status === "EN_COURS" ? "bg-yellow-100 text-yellow-800" :
                "bg-red-100 text-red-800"
              }`}>
                {commande.status}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Actions</h2>
          <div className="flex flex-col gap-2">
            {commande.status === "EN_COURS" && (
              <>
                <button
                  onClick={handleFacturer}
                  disabled={facturing}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  {facturing ? "Facturation..." : "Facturer et imprimer"}
                </button>
                <button
                  onClick={handleAnnuler}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Annuler la commande
                </button>
              </>
            )}
            {commande.status === "VALIDEE" && commande.facture && (
              <a
                href={`/api/exports/facture-bar/${commande.facture.id}`}
                target="_blank"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-center transition-colors"
              >
                Voir la facture PDF
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="p-4 bg-blue-50 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Détails de la commande</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left p-4 text-sm font-semibold text-gray-900">Boisson</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-900">Quantité</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-900">Prix unitaire</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-900">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {commande.details?.map((d: any, idx: number) => (
              <tr key={d.id} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                <td className="p-4">
                  <span className="font-medium text-gray-900">{d.boisson?.nom ?? "N/A"}</span>
                </td>
                <td className="p-4">
                  <span className="text-gray-800">{d.quantite}</span>
                </td>
                <td className="p-4">
                  <span className="text-gray-800">{Number(d.prix_total) / d.quantite} FC</span>
                </td>
                <td className="p-4">
                  <span className="font-semibold text-blue-700">{Number(d.prix_total).toFixed(2)} FC</span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-blue-50 border-t-2 border-gray-200">
            <tr>
              <td colSpan={3} className="p-4 text-right font-semibold text-gray-900">Total:</td>
              <td className="p-4">
                <span className="text-xl font-bold text-blue-700">{total.toFixed(2)} FC</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

