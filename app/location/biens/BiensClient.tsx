"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
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
  const handleDelete = async (id: number, bienNom: string) => {
    const result = await Swal.fire({
      title: "Êtes-vous sûr ?",
      text: `Voulez-vous vraiment supprimer le bien "${bienNom}" ? Cette action est irréversible.`,
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

    setDeletingId(id);
    try {
      const response = await fetch(`/api/location/biens/${id}`, { method: "DELETE" });

      let data = null;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        const text = await response.text();
        if (text.trim() !== "") {
          try {
            data = JSON.parse(text);
          } catch (parseError) {
            console.error("Erreur de parsing JSON:", parseError, "Texte reçu:", text);
            throw new Error("Réponse invalide du serveur (JSON invalide)");
          }
        }
      } else {
        const text = await response.text();
        if (text.trim() !== "") {
          throw new Error(text || `Erreur ${response.status}: ${response.statusText}`);
        }
      }

      if (!response.ok) {
        const errorMessage = data?.error || "Impossible de supprimer le bien";
        const errorDetails = data?.details ? `\n\nDétails: ${typeof data.details === 'string' ? data.details : JSON.stringify(data.details)}` : "";
        throw new Error(errorMessage + errorDetails);
      }

      await Swal.fire({
        title: "Supprimé !",
        text: `Le bien "${bienNom}" a été supprimé avec succès.`,
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
      return `${amount} $ / jour`;
    }
    return `${amount} $ / mois`;
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
                        onClick={() => handleDelete(b.id, b.nom || "ce bien")}
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

