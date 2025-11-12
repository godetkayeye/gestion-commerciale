"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ModalNouvelleCommandeBar from "@/app/components/ModalNouvelleCommandeBar";
import ModalModifierCommandeBar from "@/app/components/ModalModifierCommandeBar";

interface CommandesClientProps {
  commandes: any[];
}

export default function CommandesClient({ commandes }: CommandesClientProps) {
  const router = useRouter();
  const [modalCommandeOpen, setModalCommandeOpen] = useState(false);
  const [modalModifierOpen, setModalModifierOpen] = useState(false);
  const [commandeAModifier, setCommandeAModifier] = useState<any>(null);

  const handleRefresh = () => {
    router.refresh();
  };

  const handleModifier = (commande: any) => {
    if (commande.status !== "EN_COURS") {
      alert("Seules les commandes en cours peuvent être modifiées");
      return;
    }
    setCommandeAModifier(commande);
    setModalModifierOpen(true);
  };

  const handleAnnuler = async (id: number) => {
    if (!confirm("Annuler cette commande ? Cette action est irréversible.")) return;
    const res = await fetch(`/api/bar/commandes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ANNULEE" }),
    });
    if (res.ok) handleRefresh();
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Liste des commandes</h2>
          <button
            onClick={() => setModalCommandeOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            + Nouvelle commande
          </button>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-blue-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">#</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Table</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Serveur</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Date</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Statut</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {commandes.map((c, idx) => (
                <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="p-4">
                    <span className="font-semibold text-gray-900">#{c.id}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-800 font-medium">{c.table?.nom ?? "-"}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-800">{c.serveur?.nom ?? "-"}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-700 text-sm">
                      {c.date_commande ? new Date(c.date_commande).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "-"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      c.status === "VALIDEE" ? "bg-green-100 text-green-800" :
                      c.status === "EN_COURS" ? "bg-yellow-100 text-yellow-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => handleModifier(c)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                      >
                        Modifier
                      </button>
                      {c.status === "EN_COURS" && (
                        <>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleAnnuler(c.id)}
                            className="text-red-600 hover:text-red-800 font-medium text-sm hover:underline"
                          >
                            Annuler
                          </button>
                        </>
                      )}
                      <span className="text-gray-300">|</span>
                      <Link
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                        href={`/bar/commandes/${c.id}`}
                      >
                        Détails
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {commandes.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              Aucune commande enregistrée. Cliquez sur "Nouvelle commande" pour commencer.
            </div>
          )}
        </div>
      </div>

      <ModalNouvelleCommandeBar
        isOpen={modalCommandeOpen}
        onClose={() => setModalCommandeOpen(false)}
        onSuccess={handleRefresh}
      />
      <ModalModifierCommandeBar
        isOpen={modalModifierOpen}
        onClose={() => {
          setModalModifierOpen(false);
          setCommandeAModifier(null);
        }}
        onSuccess={handleRefresh}
        commande={commandeAModifier}
      />
    </>
  );
}

