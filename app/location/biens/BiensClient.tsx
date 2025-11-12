"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ModalAjouterBien from "@/app/components/ModalAjouterBien";

interface BiensClientProps {
  items: any[];
}

export default function BiensClient({ items }: BiensClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  const handleRefresh = () => {
    router.refresh();
  };

  const getEtatBadge = (etat: string) => {
    switch (etat) {
      case "LIBRE":
        return "bg-green-100 text-green-800";
      case "OCCUPE":
        return "bg-blue-100 text-blue-800";
      case "MAINTENANCE":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "APPARTEMENT":
        return "Appartement";
      case "BUREAU":
        return "Bureau";
      case "LOCAL_COMMERCIAL":
        return "Local commercial";
      default:
        return type;
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Liste des biens</h2>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            + Nouveau bien
          </button>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-blue-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Type</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Adresse</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Superficie</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Prix/mois</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">État</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((b, idx) => (
                <tr key={b.id} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="p-4">
                    <span className="font-medium text-gray-900">{getTypeLabel(b.type)}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-800">{b.adresse}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-800 font-medium">{Number(b.superficie).toFixed(2)} m²</span>
                  </td>
                  <td className="p-4">
                    <span className="text-blue-700 font-semibold">{Number(b.prix_mensuel).toFixed(2)} FC</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEtatBadge(b.etat)}`}>
                      {b.etat}
                    </span>
                  </td>
                  <td className="p-4">
                    <Link
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                      href={`/location/biens/${b.id}`}
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
              Aucun bien enregistré. Cliquez sur "Nouveau bien" pour commencer.
            </div>
          )}
        </div>
      </div>

      <ModalAjouterBien
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleRefresh}
      />
    </>
  );
}

