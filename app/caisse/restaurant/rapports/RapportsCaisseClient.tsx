"use client";

import { useState } from "react";
import Link from "next/link";

interface RapportsCaisseClientProps {
  totalJour: number;
  countJour: number;
  totalSemaine: number;
  countSemaine: number;
  totalMois: number;
  countMois: number;
  paiementsDetailJour: any[];
}

export default function RapportsCaisseClient({
  totalJour,
  countJour,
  totalSemaine,
  countSemaine,
  totalMois,
  countMois,
  paiementsDetailJour,
}: RapportsCaisseClientProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleDownload = async (periode: string, format: string) => {
    setLoading(`${periode}-${format}`);
    try {
      const url = `/api/exports/rapport/caisse/restaurant?periode=${periode}&format=${format}`;
      const res = await fetch(url);
      if (res.ok) {
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        const extension = format === "excel" ? "xlsx" : "pdf";
        a.download = `rapport-caisse-restaurant-${periode}-${new Date().toISOString().split("T")[0]}.${extension}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
      } else {
        alert("Erreur lors du téléchargement");
      }
    } catch (error) {
      console.error("Erreur téléchargement:", error);
      alert("Erreur lors du téléchargement");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports Financiers</h1>
          <p className="text-sm text-gray-500 mt-1">Rapports journalier, hebdomadaire et mensuel</p>
        </div>
        <Link
          href="/caisse/restaurant"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Retour à la caisse
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="text-sm text-gray-500 mb-2">Aujourd'hui</div>
          <div className="text-3xl font-bold text-blue-600 mb-1">
            {totalJour.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
          </div>
          <div className="text-sm text-gray-600">{countJour} paiement{countJour > 1 ? "s" : ""}</div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => handleDownload("jour", "pdf")}
              disabled={loading === "jour-pdf"}
              className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
            >
              {loading === "jour-pdf" ? "..." : "PDF"}
            </button>
            <button
              onClick={() => handleDownload("jour", "excel")}
              disabled={loading === "jour-excel"}
              className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
            >
              {loading === "jour-excel" ? "..." : "Excel"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="text-sm text-gray-500 mb-2">Cette semaine</div>
          <div className="text-3xl font-bold text-green-600 mb-1">
            {totalSemaine.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
          </div>
          <div className="text-sm text-gray-600">{countSemaine} paiement{countSemaine > 1 ? "s" : ""}</div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => handleDownload("semaine", "pdf")}
              disabled={loading === "semaine-pdf"}
              className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
            >
              {loading === "semaine-pdf" ? "..." : "PDF"}
            </button>
            <button
              onClick={() => handleDownload("semaine", "excel")}
              disabled={loading === "semaine-excel"}
              className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
            >
              {loading === "semaine-excel" ? "..." : "Excel"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="text-sm text-gray-500 mb-2">Ce mois</div>
          <div className="text-3xl font-bold text-purple-600 mb-1">
            {totalMois.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
          </div>
          <div className="text-sm text-gray-600">{countMois} paiement{countMois > 1 ? "s" : ""}</div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => handleDownload("mois", "pdf")}
              disabled={loading === "mois-pdf"}
              className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
            >
              {loading === "mois-pdf" ? "..." : "PDF"}
            </button>
            <button
              onClick={() => handleDownload("mois", "excel")}
              disabled={loading === "mois-excel"}
              className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
            >
              {loading === "mois-excel" ? "..." : "Excel"}
            </button>
          </div>
        </div>
      </div>

      {/* Détails des paiements d'aujourd'hui */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Détails des paiements (aujourd'hui)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Commande</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Mode</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Montant</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paiementsDetailJour.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Aucun paiement aujourd'hui
                  </td>
                </tr>
              ) : (
                paiementsDetailJour.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">#{p.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {p.reference_id ? `Commande #${p.reference_id}` : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{p.mode_paiement || "-"}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {Number(p.montant ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {p.date_paiement ? new Date(p.date_paiement).toLocaleString("fr-FR") : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

