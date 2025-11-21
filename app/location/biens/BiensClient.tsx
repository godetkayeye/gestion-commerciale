"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ModalAjouterBien from "@/app/components/ModalAjouterBien";
import ModalEditerBien from "@/app/components/ModalEditerBien";

interface BiensClientProps {
  items: any[];
}

export default function BiensClient({ items }: BiensClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBien, setEditingBien] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleRefresh = () => {
    router.refresh();
  };
  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Voulez-vous vraiment supprimer ce bien ?");
    if (!confirmed) return;
    setDeletingId(id);
    try {
      const response = await fetch(`/api/location/biens/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Suppression impossible");
      }
      alert("Bien supprimé avec succès");
      handleRefresh();
    } catch (error: any) {
      alert(error?.message || "Echec de la suppression");
    } finally {
      setDeletingId(null);
    }
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
      case "LOCAL_COMMERCIAL":
        return "Local";
      default:
        return type;
    }
  };

  const getNiveauLabel = (niveau?: string | null) => {
    switch (niveau) {
      case "REZ_DE_CHAUSSEE":
        return "Rez-de-chaussée";
      case "N1":
        return "Niveau 1 (N1)";
      case "N2":
        return "Niveau 2 (N2)";
      case "N3":
        return "Niveau 3 (N3)";
      case "N4":
        return "Niveau 4 (N4)";
      default:
        return "-";
    }
  };

  const formatPrice = (bien: any) => {
    if (!bien?.prix_mensuel && bien?.prix_mensuel !== 0) return "-";
    const amount = Number(bien.prix_mensuel).toLocaleString("fr-FR", { minimumFractionDigits: 2 });
    if (bien.type === "APPARTEMENT") {
      return `${amount} FC / jour`;
    }
    return `${amount} FC / mois`;
  };

  const formatPieces = (value?: number | null) => {
    if (!value) return "-";
    return `${value} ${value > 1 ? "pièces" : "pièce"}`;
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
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Nom du bien</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Type</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Niveau</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Superficie</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Prix</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Nombre de pièces</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">État</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((b, idx) => (
                <tr key={b.id} className={`hover:bg-blue-50/30 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/30"}`}>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900">{b.nom || "-"}</span>
                      <span className="text-sm text-gray-500">{b.adresse}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-medium text-gray-900">{getTypeLabel(b.type)}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-800">{getNiveauLabel(b.niveau)}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-800 font-medium">{Number(b.superficie).toFixed(2)} m²</span>
                  </td>
                  <td className="p-4">
                    <span className="text-blue-700 font-semibold">{formatPrice(b)}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-800">{formatPieces(b.nombre_pieces)}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${getEtatBadge(b.etat)}`}>
                      {b.etat}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingBien(b)}
                        className="inline-flex items-center gap-2 rounded-full border border-blue-600 text-blue-600 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide hover:bg-blue-600 hover:text-white transition focus:ring-2 focus:ring-blue-200"
                      >
                        <span>Éditer</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(b.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-red-500 text-red-500 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide hover:bg-red-500 hover:text-white transition focus:ring-2 focus:ring-red-200 disabled:opacity-60"
                        disabled={deletingId === b.id}
                      >
                        <span>{deletingId === b.id ? "Suppression..." : "Supprimer"}</span>
                      </button>
                    </div>
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

      <ModalEditerBien
        isOpen={editingBien !== null}
        onClose={() => setEditingBien(null)}
        onSuccess={handleRefresh}
        bien={editingBien}
      />
    </>
  );
}

