"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ModalAjouterBoisson from "@/app/components/ModalAjouterBoisson";

interface BoissonsClientProps {
  items: any[];
}

export default function BoissonsClient({ items }: BoissonsClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Liste des boissons</h2>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            + Nouvelle boisson
          </button>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
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
                    <span className="text-gray-800 font-medium">{Number(b.prix_achat).toFixed(2)} FC</span>
                  </td>
                  <td className="p-4">
                    <span className="text-blue-700 font-semibold">{Number(b.prix_vente).toFixed(2)} FC</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      b.stock <= 5 ? "bg-red-100 text-red-700" :
                      b.stock <= 15 ? "bg-yellow-100 text-yellow-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {b.stock}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-700 text-sm">{b.unite_mesure}</span>
                  </td>
                  <td className="p-4">
                    <Link
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                      href={`/bar/boissons/${b.id}`}
                    >
                      Éditer
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              Aucune boisson enregistrée. Cliquez sur "Nouvelle boisson" pour commencer.
            </div>
          )}
        </div>
      </div>

      <ModalAjouterBoisson
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleRefresh}
      />
    </>
  );
}

