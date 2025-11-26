"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTauxChange } from "@/lib/hooks/useTauxChange";
import Link from "next/link";
import ModalPaiement from "./ModalPaiement";

interface PaiementsClientProps {
  items: any[];
}

export default function PaiementsClient({ items }: PaiementsClientProps) {
  const router = useRouter();
  const { tauxChange: TAUX_CHANGE } = useTauxChange();
  const [modalOpen, setModalOpen] = useState(false);
  const [filtreBien, setFiltreBien] = useState<string>("");
  const [filtreLocataire, setFiltreLocataire] = useState<string>("");
  
  const formatUSD = (montantFC: number, tauxChangeHistorique?: number | null) => {
    // Utiliser le taux historique si disponible, sinon le taux actuel
    const taux = tauxChangeHistorique && tauxChangeHistorique > 0 ? tauxChangeHistorique : TAUX_CHANGE;
    return `${(montantFC / taux).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;
  };

  const handleRefresh = () => {
    router.refresh();
  };

  const handleImprimer = (id: number) => {
    window.open(`/api/exports/recu-paiement-location/${id}`, "_blank");
  };

  // Filtrer les paiements
  const formatDate = (value: any) => {
    if (!value) return "-";
    try {
      if (typeof value === "string") {
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          const [y, m, d] = value.split("-");
          const parsed = new Date(Number(y), Number(m) - 1, Number(d));
          return parsed.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
        }
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) {
          return parsed.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
        }
      } else if (value instanceof Date) {
        if (!isNaN(value.getTime())) {
          return value.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
        }
      }
    } catch {}
    return "-";
  };

  const paiementsFiltres = items.filter((p) => {
    const matchBien = !filtreBien || p.contrat?.bien?.adresse?.toLowerCase().includes(filtreBien.toLowerCase());
    const matchLocataire = !filtreLocataire || p.contrat?.locataire?.nom?.toLowerCase().includes(filtreLocataire.toLowerCase());
    return matchBien && matchLocataire;
  });

  // Obtenir les listes uniques pour les filtres
  const biensUniques = Array.from(new Set(items.map(p => p.contrat?.bien?.adresse).filter(Boolean)));
  const locatairesUniques = Array.from(new Set(items.map(p => p.contrat?.locataire?.nom).filter(Boolean)));

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Liste des paiements</h2>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            + Nouveau paiement
          </button>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Filtres</h3>
            <button
              type="button"
              onClick={() => { setFiltreBien(""); setFiltreLocataire(""); }}
              className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
            >
              Réinitialiser
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Filtrer par bien</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/></svg>
                </span>
                <input
                  type="text"
                  value={filtreBien}
                  onChange={(e) => setFiltreBien(e.target.value)}
                  placeholder="Rechercher une adresse de bien..."
                  className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 placeholder-gray-500 bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Filtrer par locataire</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M10 2a5 5 0 100 10A5 5 0 0010 2z"/><path fillRule="evenodd" d="M.458 16.042A8 8 0 0110 12a8 8 0 019.542 4.042A1 1 0 0118.7 17.7a10 10 0 00-17.4 0 1 1 0 01-1.842-1.658z" clipRule="evenodd"/></svg>
                </span>
                <input
                  type="text"
                  value={filtreLocataire}
                  onChange={(e) => setFiltreLocataire(e.target.value)}
                  placeholder="Rechercher un locataire..."
                  className="w-full pl-10 pr-3 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 placeholder-gray-500 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-blue-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Date</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Bien</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Locataire</th>
                <th className="text-right p-4 text-sm font-semibold text-gray-900">Montant</th>
                <th className="text-right p-4 text-sm font-semibold text-gray-900">Reste dû</th>
                <th className="text-right p-4 text-sm font-semibold text-gray-900">Pénalité</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paiementsFiltres.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    {items.length === 0 ? "Aucun paiement enregistré" : "Aucun paiement ne correspond aux filtres"}
                  </td>
                </tr>
              ) : (
                paiementsFiltres.map((p, idx) => (
                  <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="p-4">
                      <span className="text-gray-900">
                        {formatDate(p.date_paiement)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-900 font-medium">{p.contrat?.bien?.adresse ?? "-"}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-900">{p.contrat?.locataire?.nom ?? "-"}</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-semibold text-gray-900">
                        {formatUSD(Number(p.montant), p.taux_change)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {Number(p.reste_du) > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          {formatUSD(Number(p.reste_du), p.taux_change)}
                        </span>
                      ) : (
                        <span className="text-green-600 font-medium">Payé</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {Number(p.penalite) > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                          {formatUSD(Number(p.penalite), p.taux_change)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleImprimer(p.id)}
                        className="text-purple-600 hover:text-purple-800 font-medium text-sm hover:underline"
                      >
                        Imprimer reçu
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ModalPaiement
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleRefresh}
      />
    </>
  );
}

