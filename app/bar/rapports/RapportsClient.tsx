"use client";

import { useState } from "react";

interface RapportsClientProps {
  caJour: number;
  caSemaine: number;
  caMois: number;
  boissonsVendues: any[];
  serveursPerformants: any[];
}

export default function RapportsClient({
  caJour,
  caSemaine,
  caMois,
  boissonsVendues,
  serveursPerformants
}: RapportsClientProps) {
  const [loading, setLoading] = useState(false);

  const handleExportPDF = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/exports/rapport/bar/pdf");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `rapport-bar-${new Date().toISOString().split("T")[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("Erreur lors de l'export PDF");
      }
    } catch (error) {
      console.error("Erreur export PDF:", error);
      alert("Erreur lors de l'export PDF");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/exports/rapport/bar/excel");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `rapport-bar-${new Date().toISOString().split("T")[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("Erreur lors de l'export Excel");
      }
    } catch (error) {
      console.error("Erreur export Excel:", error);
      alert("Erreur lors de l'export Excel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Boutons d'export */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={handleExportPDF}
          disabled={loading}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
        >
          {loading ? "Export en cours..." : "Exporter en PDF"}
        </button>
        <button
          onClick={handleExportExcel}
          disabled={loading}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
        >
          {loading ? "Export en cours..." : "Exporter en Excel"}
        </button>
      </div>

      {/* Chiffre d'affaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Chiffre d'affaires (Jour)</p>
              <p className="text-3xl font-bold text-blue-700">{caJour.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Chiffre d'affaires (Semaine)</p>
              <p className="text-3xl font-bold text-green-700">{caSemaine.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC</p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Chiffre d'affaires (Mois)</p>
              <p className="text-3xl font-bold text-purple-700">{caMois.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Boissons les plus vendues */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-indigo-50 border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Boissons les plus vendues (Mois)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-gray-900">Rang</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-900">Boisson</th>
                  <th className="text-right p-4 text-sm font-semibold text-gray-900">Quantité</th>
                  <th className="text-right p-4 text-sm font-semibold text-gray-900">CA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {boissonsVendues.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      Aucune vente enregistrée
                    </td>
                  </tr>
                ) : (
                  boissonsVendues.map((b, idx) => (
                    <tr key={b.boisson_id} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                      <td className="p-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-sm">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-gray-900">{b.nom}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-gray-800 font-semibold">{b.quantite_vendue}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-bold text-green-700">{Number(b.chiffre_affaires).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Serveurs les plus performants */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-amber-50 border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Serveurs les plus performants (Mois)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-gray-900">Rang</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-900">Serveur</th>
                  <th className="text-right p-4 text-sm font-semibold text-gray-900">Commandes</th>
                  <th className="text-right p-4 text-sm font-semibold text-gray-900">CA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {serveursPerformants.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      Aucune performance enregistrée
                    </td>
                  </tr>
                ) : (
                  serveursPerformants.map((s, idx) => (
                    <tr key={s.serveur_id} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                      <td className="p-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold text-sm">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-gray-900">{s.nom}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-gray-800 font-semibold">{s.nombre_commandes}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-bold text-green-700">{Number(s.chiffre_affaires).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

