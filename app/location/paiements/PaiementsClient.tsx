"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ModalPaiement from "./ModalPaiement";

interface PaiementsClientProps {
  items: any[];
}

export default function PaiementsClient({ items }: PaiementsClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [filtreBien, setFiltreBien] = useState<string>("");
  const [filtreLocataire, setFiltreLocataire] = useState<string>("");

  const handleRefresh = () => {
    router.refresh();
  };

  const handleImprimer = (id: number) => {
    window.open(`/api/exports/recu-paiement-location/${id}`, "_blank");
  };

  // Filtrer les paiements
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
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filtrer par bien</label>
              <input
                type="text"
                value={filtreBien}
                onChange={(e) => setFiltreBien(e.target.value)}
                placeholder="Rechercher un bien..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filtrer par locataire</label>
              <input
                type="text"
                value={filtreLocataire}
                onChange={(e) => setFiltreLocataire(e.target.value)}
                placeholder="Rechercher un locataire..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
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
                        {new Date(p.date_paiement).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}
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
                        {Number(p.montant).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {Number(p.reste_du) > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          {Number(p.reste_du).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC
                        </span>
                      ) : (
                        <span className="text-green-600 font-medium">Payé</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {Number(p.penalite) > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                          {Number(p.penalite).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC
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

