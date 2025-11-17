"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

interface EconomatClientProps {
  boissons: Boisson[];
  mouvements: Mouvement[];
  userRole: string;
}

export default function EconomatClient({ boissons: initialBoissons, mouvements: initialMouvements, userRole }: EconomatClientProps) {
  const router = useRouter();
  const [boissons, setBoissons] = useState(initialBoissons);
  const [mouvements, setMouvements] = useState(initialMouvements);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    boisson_id: "",
    type: "ENTREE" as "ENTREE" | "SORTIE",
    quantite: "",
  });

  const canEdit = userRole === "ADMIN" || userRole === "ECONOMAT" || userRole === "SUPERVISEUR" || userRole === "MANAGER_MULTI";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.boisson_id || !formData.quantite) {
        throw new Error("Veuillez remplir tous les champs");
      }

      const quantite = Number(formData.quantite);
      if (quantite <= 0) {
        throw new Error("La quantité doit être supérieure à 0");
      }

      // Pour les sorties, vérifier le stock disponible
      if (formData.type === "SORTIE") {
        const boisson = boissons.find((b) => b.id === Number(formData.boisson_id));
        if (!boisson) throw new Error("Boisson introuvable");
        if (boisson.stock < quantite) {
          throw new Error(`Stock insuffisant. Stock disponible: ${boisson.stock} ${boisson.unite_mesure}`);
        }
      }

      const res = await fetch("/api/bar/mouvements-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boisson_id: Number(formData.boisson_id),
          type: formData.type,
          quantite: quantite,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'enregistrement");
      }

      // Recharger la page pour mettre à jour les données
      router.refresh();
      setShowModal(false);
      setFormData({ boisson_id: "", type: "ENTREE", quantite: "" });
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bouton ajouter mouvement */}
      {canEdit && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 md:px-6 md:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm md:text-base"
          >
            + Nouveau mouvement de stock
          </button>
        </div>
      )}

      {/* Liste des stocks */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-blue-50 border-b border-gray-200 px-4 py-3">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">État des stocks</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Boisson</th>
                <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-700 uppercase hidden sm:table-cell">Catégorie</th>
                <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Stock</th>
                <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-700 uppercase hidden md:table-cell">Unité</th>
                <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-700 uppercase">État</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {boissons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                    Aucune boisson enregistrée
                  </td>
                </tr>
              ) : (
                boissons.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 md:px-4 py-3 font-medium text-gray-900">{b.nom}</td>
                    <td className="px-3 md:px-4 py-3 text-gray-600 hidden sm:table-cell">{b.categorie?.nom || "-"}</td>
                    <td className="px-3 md:px-4 py-3 font-semibold text-gray-900">{b.stock}</td>
                    <td className="px-3 md:px-4 py-3 text-gray-600 hidden md:table-cell">{b.unite_mesure}</td>
                    <td className="px-3 md:px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        b.stock === 0 ? "bg-red-100 text-red-800" :
                        b.stock <= 5 ? "bg-yellow-100 text-yellow-800" :
                        "bg-green-100 text-green-800"
                      }`}>
                        {b.stock === 0 ? "Rupture" : b.stock <= 5 ? "Faible" : "Disponible"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historique des mouvements */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">Historique des mouvements</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Date</th>
                <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Boisson</th>
                <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Type</th>
                <th className="text-left px-3 md:px-4 py-3 text-xs font-semibold text-gray-700 uppercase">Quantité</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {mouvements.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                    Aucun mouvement enregistré
                  </td>
                </tr>
              ) : (
                mouvements.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 md:px-4 py-3 text-gray-600 text-xs">
                      {m.date_mouvement ? new Date(m.date_mouvement).toLocaleString("fr-FR") : "-"}
                    </td>
                    <td className="px-3 md:px-4 py-3 font-medium text-gray-900">{m.boisson?.nom || "N/A"}</td>
                    <td className="px-3 md:px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        m.type === "ENTREE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {m.type === "ENTREE" ? "Entrée" : "Sortie"}
                      </span>
                    </td>
                    <td className="px-3 md:px-4 py-3">
                      <span className={`font-semibold ${m.type === "ENTREE" ? "text-green-700" : "text-red-700"}`}>
                        {m.type === "ENTREE" ? "+" : "-"}{m.quantite}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal nouveau mouvement */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-4 md:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Nouveau mouvement de stock</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setError(null);
                  setFormData({ boisson_id: "", type: "ENTREE", quantite: "" });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Boisson <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.boisson_id}
                  onChange={(e) => setFormData({ ...formData, boisson_id: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                >
                  <option value="">-- Sélectionner une boisson --</option>
                  {boissons.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nom} (Stock: {b.stock} {b.unite_mesure})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Type de mouvement <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as "ENTREE" | "SORTIE" })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                >
                  <option value="ENTREE">Entrée (Réapprovisionnement)</option>
                  <option value="SORTIE">Sortie (Consommation)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Quantité <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formData.quantite}
                  onChange={(e) => setFormData({ ...formData, quantite: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base"
                  placeholder="Quantité"
                />
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-700 font-semibold">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setError(null);
                    setFormData({ boisson_id: "", type: "ENTREE", quantite: "" });
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all text-sm md:text-base"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm md:text-base"
                >
                  {loading ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

