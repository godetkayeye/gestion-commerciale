"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ModalLocataire from "./ModalLocataire";

interface LocatairesClientProps {
  items: any[];
}

export default function LocatairesClient({ items }: LocatairesClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const handleRefresh = () => {
    router.refresh();
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce locataire ?")) return;
    const res = await fetch(`/api/location/locataires/${id}`, { method: "DELETE" });
    if (res.ok) {
      handleRefresh();
    } else {
      const data = await res.json();
      alert(data.error || "Erreur lors de la suppression");
    }
  };

  // Déterminer le statut du locataire basé sur ses contrats
  const getStatutLocataire = (locataire: any) => {
    if (!locataire.contrats || locataire.contrats.length === 0) {
      return "En attente";
    }
    const contratsActifs = locataire.contrats.filter((c: any) => c.statut === "ACTIF");
    if (contratsActifs.length > 0) {
      return "Actif";
    }
    return "Ancien";
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case "Actif":
        return "bg-green-100 text-green-800";
      case "Ancien":
        return "bg-gray-100 text-gray-800";
      case "En attente":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Liste des locataires</h2>
          <button
            onClick={() => {
              setEditingItem(null);
              setModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            + Nouveau locataire
          </button>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-blue-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Nom</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Contact</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Profession</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Pièce d'identité</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Statut</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Aucun locataire enregistré
                  </td>
                </tr>
              ) : (
                items.map((l, idx) => (
                  <tr key={l.id} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="p-4">
                      <span className="font-medium text-gray-900">{l.nom}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-800">{l.contact || "-"}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-800">{l.profession || "-"}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-800">{l.piece_identite || "-"}</span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatutColor(getStatutLocataire(l))}`}>
                        {getStatutLocataire(l)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(l)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                        >
                          Éditer
                        </button>
                        <Link
                          href={`/location/locataires/${l.id}/historique`}
                          className="text-green-600 hover:text-green-800 font-medium text-sm hover:underline"
                        >
                          Historique
                        </Link>
                        <button
                          onClick={() => handleDelete(l.id)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm hover:underline"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ModalLocataire
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSuccess={handleRefresh}
        editingItem={editingItem}
      />
    </>
  );
}

