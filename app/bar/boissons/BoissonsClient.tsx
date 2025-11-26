"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ModalAjouterBoisson from "@/app/components/ModalAjouterBoisson";

interface BoissonsClientProps {
  items: any[];
}

const TAUX_CHANGE = 2200; // 1 $ = 2200 FC

export default function BoissonsClient({ items }: BoissonsClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [boissonEditing, setBoissonEditing] = useState<any | null>(null);

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
                {items.map((b, idx) => (
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
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-gray-100">
            {items.length === 0 && (
              <div className="p-6 text-center text-gray-500">Aucune boisson enregistrée.</div>
            )}
            {items.map((b) => (
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
            ))}
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

