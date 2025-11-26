"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTauxChange } from "@/lib/hooks/useTauxChange";
import ModalAjouterBoisson from "@/app/components/ModalAjouterBoisson";

interface BoissonsClientProps {
  items: any[];
}

export default function BoissonsClient({ items }: BoissonsClientProps) {
  const router = useRouter();
  const { tauxChange: TAUX_CHANGE } = useTauxChange();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [boissonEditing, setBoissonEditing] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrer les boissons selon le terme de recherche
  const filteredItems = items.filter((b) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const nom = (b.nom || "").toLowerCase();
    const categorie = (b.categorie?.nom || "").toLowerCase();
    return nom.includes(term) || categorie.includes(term);
  });

  const handleRefresh = () => {
    router.refresh();
  };

  const openCreateModal = () => {
    setModalMode("create");
    setBoissonEditing(null);
    setModalOpen(true);
  };

  const openEditModal = (boisson: any) => {
    setModalMode("edit");
    setBoissonEditing(boisson);
    setModalOpen(true);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Liste des boissons</h2>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            + Nouvelle boisson
          </button>
        </div>
        
        {/* Champ de recherche */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Rechercher une boisson par nom ou catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors text-gray-900 placeholder:text-gray-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              aria-label="Effacer la recherche"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {searchTerm && (
          <div className="text-sm text-gray-600">
            {filteredItems.length === 0 ? (
              <span className="text-red-600">Aucun résultat trouvé pour "{searchTerm}"</span>
            ) : (
              <span>{filteredItems.length} boisson{filteredItems.length > 1 ? "s" : ""} trouvée{filteredItems.length > 1 ? "s" : ""}</span>
            )}
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-gray-900">Nom</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-900">Catégorie</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-900">Prix d'achat</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-900">Prix de vente</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-900">Stock</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-900">Unité</th>
                  <th className="text-left p-4 text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      {searchTerm ? "Aucun résultat trouvé" : "Aucune boisson enregistrée"}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((b, idx) => (
                  <tr key={b.id} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="p-4">
                      <span className="font-medium text-gray-900">{b.nom}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-700">{b.categorie?.nom ?? "-"}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-800 font-medium">{(Number(b.prix_achat) / TAUX_CHANGE).toFixed(2)} $</span>
                    </td>
                    <td className="p-4">
                      <span className="text-blue-700 font-semibold">{(Number(b.prix_vente) / TAUX_CHANGE).toFixed(2)} $</span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-sm font-medium ${
                          b.stock <= 5
                            ? "bg-red-100 text-red-700"
                            : b.stock <= 15
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {b.stock}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-700 text-sm">{b.unite_mesure}</span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => openEditModal(b)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                      >
                        Éditer
                      </button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-gray-100">
            {filteredItems.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                {searchTerm ? "Aucun résultat trouvé" : "Aucune boisson enregistrée"}
              </div>
            ) : (
              filteredItems.map((b) => (
              <div key={b.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-base font-semibold text-gray-900">{b.nom}</div>
                    <div className="text-xs text-gray-500">{b.categorie?.nom ?? "Sans catégorie"}</div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      b.stock <= 5
                        ? "bg-red-100 text-red-700"
                        : b.stock <= 15
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {b.stock} {b.unite_mesure}
                  </span>
                </div>
                <div className="flex flex-wrap text-sm text-gray-600 gap-4">
                  <span>PA: {(Number(b.prix_achat) / TAUX_CHANGE).toFixed(2)} $</span>
                  <span>PV: {(Number(b.prix_vente) / TAUX_CHANGE).toFixed(2)} $</span>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => openEditModal(b)}
                    className="w-full inline-flex items-center justify-center px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Modifier
                  </button>
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ModalAjouterBoisson
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleRefresh}
        mode={modalMode}
        boisson={boissonEditing}
      />
    </>
  );
}

