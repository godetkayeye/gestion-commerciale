"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import ModalLocataire from "./ModalLocataire";
import ModalHistoriqueLocataire from "./ModalHistoriqueLocataire";

interface LocatairesClientProps {
  items: any[];
}

export default function LocatairesClient({ items }: LocatairesClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [historiqueId, setHistoriqueId] = useState<number | null>(null);
  const [historiqueNom, setHistoriqueNom] = useState<string | undefined>(undefined);
  const [historiqueOpen, setHistoriqueOpen] = useState(false);

  const handleRefresh = () => {
    router.refresh();
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDelete = async (id: number, locataireNom: string) => {
    const result = await Swal.fire({
      title: "Êtes-vous sûr ?",
      text: `Voulez-vous vraiment supprimer le locataire "${locataireNom}" ? Cette action est irréversible.`,
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
      const res = await fetch(`/api/location/locataires/${id}`, { method: "DELETE" });

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
        const errorMessage = data?.error || "Impossible de supprimer le locataire";
        const errorDetails = data?.details ? `\n\nDétails: ${typeof data.details === 'string' ? data.details : JSON.stringify(data.details)}` : "";
        throw new Error(errorMessage + errorDetails);
      }

      await Swal.fire({
        title: "Supprimé !",
        text: `Le locataire "${locataireNom}" a été supprimé avec succès.`,
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Liste des locataires</h2>
          <button
            onClick={() => {
              setEditingItem(null);
              setModalOpen(true);
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all"
          >
            + Nouveau locataire
          </button>
        </div>

        {/* Version Desktop - Tableau */}
        <div className="hidden md:block rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
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
                        {l.piece_identite ? (
                          <div className="flex items-center gap-2">
                            <img
                              src={l.piece_identite}
                              alt="Pièce d'identité"
                              className="w-12 h-12 object-cover rounded-lg border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                              onClick={() => window.open(l.piece_identite, "_blank")}
                            />
                            <button
                              onClick={() => window.open(l.piece_identite, "_blank")}
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium hover:underline"
                            >
                              Voir
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatutColor(getStatutLocataire(l))}`}>
                          {getStatutLocataire(l)}
                        </span>
                      </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleEdit(l)}
                        className="inline-flex items-center gap-2 rounded-full border border-blue-600 text-blue-600 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide hover:bg-blue-600 hover:text-white transition focus:ring-2 focus:ring-blue-200"
                      >
                        <span>Éditer</span>
                      </button>
                      <button
                        onClick={() => {
                          setHistoriqueId(l.id);
                          setHistoriqueNom(l.nom);
                          setHistoriqueOpen(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-green-600 text-green-600 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide hover:bg-green-600 hover:text-white transition focus:ring-2 focus:ring-green-200"
                      >
                        <span>Historique</span>
                      </button>
                      <button
                        onClick={() => handleDelete(l.id, l.nom || "ce locataire")}
                        className="inline-flex items-center gap-2 rounded-full border border-red-500 text-red-500 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide hover:bg-red-500 hover:text-white transition focus:ring-2 focus:ring-red-200"
                      >
                        <span>Supprimer</span>
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

        {/* Version Mobile - Cartes */}
        <div className="md:hidden space-y-4">
          {items.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-white rounded-lg border border-gray-200">
              Aucun locataire enregistré
            </div>
          ) : (
            items.map((l) => (
              <div key={l.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-base mb-1">{l.nom}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatutColor(getStatutLocataire(l))}`}>
                      {getStatutLocataire(l)}
                    </span>
                  </div>
                  {l.piece_identite && (
                    <img
                      src={l.piece_identite}
                      alt="Pièce d'identité"
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                      onClick={() => window.open(l.piece_identite, "_blank")}
                    />
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  {l.contact && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-medium">Contact:</span>
                      <span className="text-gray-800">{l.contact}</span>
                    </div>
                  )}
                  {l.profession && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-medium">Profession:</span>
                      <span className="text-gray-800">{l.profession}</span>
                    </div>
                  )}
                  {!l.piece_identite && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-medium">Pièce d'identité:</span>
                      <span className="text-gray-400">-</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(l)}
                    className="flex-1 min-w-[100px] inline-flex items-center justify-center gap-2 rounded-full border border-blue-600 text-blue-600 px-3 py-2 text-xs font-semibold uppercase tracking-wide hover:bg-blue-600 hover:text-white transition"
                  >
                    <span>Éditer</span>
                  </button>
                  <button
                    onClick={() => {
                      setHistoriqueId(l.id);
                      setHistoriqueNom(l.nom);
                      setHistoriqueOpen(true);
                    }}
                    className="flex-1 min-w-[100px] inline-flex items-center justify-center gap-2 rounded-full border text-green-600 border-green-600 px-3 py-2 text-xs font-semibold uppercase tracking-wide hover:bg-green-600 hover:text-white transition"
                  >
                    <span>Historique</span>
                  </button>
                  <button
                    onClick={() => handleDelete(l.id, l.nom || "ce locataire")}
                    className="flex-1 min-w-[100px] inline-flex items-center justify-center gap-2 rounded-full border border-red-500 text-red-500 px-3 py-2 text-xs font-semibold uppercase tracking-wide hover:bg-red-500 hover:text-white transition"
                  >
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>
            ))
          )}
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

      <ModalHistoriqueLocataire
        isOpen={historiqueOpen}
        onClose={() => setHistoriqueOpen(false)}
        locataireId={historiqueId}
        locataireNom={historiqueNom}
      />
    </>
  );
}

