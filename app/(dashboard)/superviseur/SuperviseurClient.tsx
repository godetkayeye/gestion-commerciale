"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import EconomatClient from "../economat/EconomatClient";

interface CommandeBar {
  id: number;
  table?: { nom: string } | null;
  serveur?: { nom: string } | null;
  status: string;
  date_commande: string | null;
  details: Array<{ boisson?: { nom: string } | null; quantite: number; prix_total: number }>;
}

interface CommandeRestaurant {
  id: number;
  table_numero: string | null;
  statut: string;
  date_commande: string | null;
  total: number | null;
  details: Array<{ repas?: { nom: string } | null; quantite: number; prix_total: number }>;
}

interface Boisson {
  id: number;
  nom: string;
  stock: number;
  unite_mesure: string;
  categorie?: { nom: string } | null;
}

interface Mouvement {
  id: number;
  boisson_id: number | null;
  type: string;
  quantite: number;
  date_mouvement: string | null;
  boisson?: { nom: string } | null;
}

interface SuperviseurClientProps {
  commandesBar: CommandeBar[];
  commandesRestaurant: CommandeRestaurant[];
  boissons: Boisson[];
  mouvements: Mouvement[];
  userRole: string;
}

export default function SuperviseurClient({
  commandesBar,
  commandesRestaurant,
  boissons,
  mouvements,
  userRole,
}: SuperviseurClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"commandes" | "stocks">("commandes");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnnulerCommandeBar = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir annuler cette commande ? Cette action est irréversible.")) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bar/commandes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ANNULEE" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'annulation");
      }

      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'annulation");
    } finally {
      setLoading(false);
    }
  };

  const handleAnnulerCommandeRestaurant = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir annuler cette commande ? Cette action est irréversible.")) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/restaurant/commandes/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'annulation");
      }

      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'annulation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4 md:space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab("commandes")}
            className={`py-3 md:py-4 px-1 border-b-2 font-medium text-sm md:text-base whitespace-nowrap transition-colors ${
              activeTab === "commandes"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Commandes ({commandesBar.length + commandesRestaurant.length})
          </button>
          <button
            onClick={() => setActiveTab("stocks")}
            className={`py-3 md:py-4 px-1 border-b-2 font-medium text-sm md:text-base whitespace-nowrap transition-colors ${
              activeTab === "stocks"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Gestion des stocks
          </button>
        </nav>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700 font-semibold">{error}</p>
        </div>
      )}

      {activeTab === "commandes" && (
        <div className="space-y-6">
          {/* Commandes Bar */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-blue-50 border-b border-gray-200 px-4 py-3">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Commandes BLACK & WHITE (Bar/Terrasse)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-700 uppercase">#</th>
                    <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Table</th>
                    <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-700 uppercase hidden sm:table-cell">Serveur</th>
                    <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Statut</th>
                    <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-700 uppercase hidden md:table-cell">Date</th>
                    <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {commandesBar.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                        Aucune commande en cours
                      </td>
                    </tr>
                  ) : (
                    commandesBar.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 md:px-4 py-3 font-semibold text-gray-900">#{c.id}</td>
                        <td className="px-3 md:px-4 py-3 text-gray-900">{c.table?.nom || "-"}</td>
                        <td className="px-3 md:px-4 py-3 text-gray-900 hidden sm:table-cell">{c.serveur?.nom || "-"}</td>
                        <td className="px-3 md:px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            c.status === "VALIDEE" ? "bg-green-100 text-green-800" :
                            c.status === "EN_COURS" ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {c.status === "VALIDEE" ? "Validée" :
                             c.status === "EN_COURS" ? "En cours" :
                             "Annulée"}
                          </span>
                        </td>
                        <td className="px-3 md:px-4 py-3 text-gray-600 text-xs hidden md:table-cell">
                          {c.date_commande ? new Date(c.date_commande).toLocaleDateString("fr-FR") : "-"}
                        </td>
                        <td className="px-3 md:px-4 py-3">
                          {c.status !== "ANNULEE" && (
                            <button
                              onClick={() => handleAnnulerCommandeBar(c.id)}
                              disabled={loading}
                              className="px-2 md:px-3 py-1 md:py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              Annuler
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Commandes Restaurant */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-green-50 border-b border-gray-200 px-4 py-3">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Commandes VILAKAZI (Restaurant)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-700 uppercase">#</th>
                    <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Table</th>
                    <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-700 uppercase hidden sm:table-cell">Total</th>
                    <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Statut</th>
                    <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-700 uppercase hidden md:table-cell">Date</th>
                    <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {commandesRestaurant.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                        Aucune commande en cours
                      </td>
                    </tr>
                  ) : (
                    commandesRestaurant.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 md:px-4 py-3 font-semibold text-gray-900">#{c.id}</td>
                        <td className="px-3 md:px-4 py-3 text-gray-900">{c.table_numero || "-"}</td>
                        <td className="px-3 md:px-4 py-3 font-medium text-gray-900 hidden sm:table-cell">
                          {Number(c.total ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
                        </td>
                        <td className="px-3 md:px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            c.statut === "PAYE" ? "bg-green-100 text-green-800" :
                            c.statut === "SERVI" ? "bg-blue-100 text-blue-800" :
                            c.statut === "EN_PREPARATION" ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {c.statut === "PAYE" ? "Payé" :
                             c.statut === "SERVI" ? "Servi" :
                             c.statut === "EN_PREPARATION" ? "En préparation" :
                             "En attente"}
                          </span>
                        </td>
                        <td className="px-3 md:px-4 py-3 text-gray-600 text-xs hidden md:table-cell">
                          {c.date_commande ? new Date(c.date_commande).toLocaleDateString("fr-FR") : "-"}
                        </td>
                        <td className="px-3 md:px-4 py-3">
                          {c.statut !== "ANNULEE" && (
                            <button
                              onClick={() => handleAnnulerCommandeRestaurant(c.id)}
                              disabled={loading}
                              className="px-2 md:px-3 py-1 md:py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                            >
                              Annuler
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "stocks" && (
        <EconomatClient boissons={boissons} mouvements={mouvements} userRole={userRole} />
      )}
    </div>
  );
}

