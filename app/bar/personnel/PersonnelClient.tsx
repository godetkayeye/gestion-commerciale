"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import ModalPersonnel from "./ModalPersonnel";

interface PersonnelClientProps {
  items: any[];
}

export default function PersonnelClient({ items }: PersonnelClientProps) {
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

  const handleDelete = async (id: number, personnelNom: string) => {
    const result = await Swal.fire({
      title: "Êtes-vous sûr ?",
      text: `Voulez-vous vraiment supprimer le membre du personnel "${personnelNom}" ? Cette action est irréversible.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const res = await fetch(`/api/bar/personnel/${id}`, { method: "DELETE" });

      let data = null;
      const contentType = res.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        const text = await res.text();
        if (text.trim() !== "") {
          try {
            data = JSON.parse(text);
          } catch (parseError) {
            console.error("Erreur de parsing JSON:", parseError, "Texte reçu:", text);
            throw new Error("Réponse invalide du serveur (JSON invalide)");
          }
        }
      } else {
        const text = await res.text();
        if (text.trim() !== "") {
          throw new Error(text || `Erreur ${res.status}: ${res.statusText}`);
        }
      }

      if (!res.ok) {
        const errorMessage = data?.error || "Impossible de supprimer le membre du personnel";
        const errorDetails = data?.details ? `\n\nDétails: ${typeof data.details === 'string' ? data.details : JSON.stringify(data.details)}` : "";
        throw new Error(errorMessage + errorDetails);
      }

      await Swal.fire({
        title: "Supprimé !",
        text: `Le membre du personnel "${personnelNom}" a été supprimé avec succès.`,
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#10b981",
      });

      handleRefresh();
    } catch (error: any) {
      await Swal.fire({
        title: "Erreur !",
        text: error.message || "Erreur lors de la suppression",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Liste du personnel</h2>
          <button
            onClick={() => {
              setEditingItem(null);
              setModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            + Nouveau membre
          </button>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-blue-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Nom</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Rôle</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    Aucun membre du personnel enregistré
                  </td>
                </tr>
              ) : (
                items.map((p, idx) => (
                  <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                    <td className="p-4">
                      <span className="font-medium text-gray-900">{p.nom}</span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        p.role === "SERVEUR" ? "bg-green-100 text-green-800" : "bg-purple-100 text-purple-800"
                      }`}>
                        {p.role === "SERVEUR" ? "Serveur" : "Barman"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(p)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                        >
                          Éditer
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.nom || "ce membre")}
                          className="text-red-600 hover:text-red-800 font-medium text-sm hover:underline"
                        >
                          Supprimer
                        </button>
                        <a
                          href={`/bar/personnel/${p.id}/ventes`}
                          className="text-green-600 hover:text-green-800 font-medium text-sm hover:underline"
                        >
                          Voir ventes
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ModalPersonnel
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

