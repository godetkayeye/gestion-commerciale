"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ModalContrat from "./ModalContrat";

interface ContratsClientProps {
  items: any[];
}

export default function ContratsClient({ items }: ContratsClientProps) {
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

  const handleRenouveler = (item: any) => {
    // Créer un nouveau contrat basé sur l'ancien
    const dateDebut = new Date(item.date_fin);
    const dateFinAncien = new Date(item.date_fin);
    const dateDebutAncien = new Date(item.date_debut);
    // Calculer la durée en millisecondes
    const dureeMs = dateFinAncien.getTime() - dateDebutAncien.getTime();
    // Nouvelle date de fin = date de fin ancienne + durée
    const nouvelleDateFin = new Date(dateFinAncien.getTime() + dureeMs);
    
    const nouveauContrat = {
      bien_id: item.bien_id,
      locataire_id: item.locataire_id,
      date_debut: dateDebut.toISOString().split('T')[0],
      date_fin: nouvelleDateFin.toISOString().split('T')[0],
      depot_garantie: item.depot_garantie,
      avance: null, // Nouvelle avance à définir
      statut: "EN_ATTENTE"
    };
    setEditingItem(nouveauContrat);
    setModalOpen(true);
  };

  const handleImprimer = async (id: number) => {
    window.open(`/api/exports/contrat-location/${id}`, "_blank");
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce contrat ? Cette action est irréversible.")) return;
    const res = await fetch(`/api/location/contrats/${id}`, { method: "DELETE" });
    if (res.ok) {
      handleRefresh();
    } else {
      const data = await res.json();
      alert(data.error || "Erreur lors de la suppression");
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Liste des contrats</h2>
          <button
            onClick={() => {
              setEditingItem(null);
              setModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            + Nouveau contrat
          </button>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-blue-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">#</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Bien</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Locataire</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Date début</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Date fin</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Statut</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    Aucun contrat enregistré
                  </td>
                </tr>
              ) : (
                items.map((c, idx) => (
                  <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="p-4">
                      <span className="font-semibold text-gray-900">#{c.id}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-900 font-medium">{c.bien?.adresse ?? "-"}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-900">{c.locataire?.nom ?? "-"}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-800">
                        {new Date(c.date_debut).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-800">
                        {new Date(c.date_fin).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        c.statut === "ACTIF" ? "bg-green-100 text-green-800" :
                        c.statut === "TERMINE" ? "bg-gray-100 text-gray-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        {c.statut === "ACTIF" ? "Actif" : c.statut === "TERMINE" ? "Terminé" : "En attente"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 items-center flex-wrap">
                        <button
                          onClick={() => handleEdit(c)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                        >
                          Éditer
                        </button>
                        <button
                          onClick={() => handleImprimer(c.id)}
                          className="text-purple-600 hover:text-purple-800 font-medium text-sm hover:underline"
                        >
                          Imprimer
                        </button>
                        <Link
                          href={`/location/contrats/${c.id}`}
                          className="text-green-600 hover:text-green-800 font-medium text-sm hover:underline"
                        >
                          Détails
                        </Link>
                        {c.statut === "TERMINE" && (
                          <button
                            onClick={() => handleRenouveler(c)}
                            className="text-green-600 hover:text-green-800 font-medium text-sm hover:underline"
                          >
                            Renouveler
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(c.id)}
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
      <ModalContrat
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

