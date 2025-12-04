"use client";

import { useState, useEffect } from "react";

interface ModalModifierCommandeRestaurantProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  commande: any;
}

export default function ModalModifierCommandeRestaurant({ 
  isOpen, 
  onClose, 
  onSuccess, 
  commande 
}: ModalModifierCommandeRestaurantProps) {
  const [plats, setPlats] = useState<any[]>([]);
  const [boissons, setBoissons] = useState<any[]>([]);
  const [form, setForm] = useState({
    items: [] as Array<{ repas_id: number; quantite: number; repas_nom?: string }>,
    items_boissons: [] as Array<{ boisson_id: number; quantite: number; boisson_nom?: string }>,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"plats" | "boissons">("plats");

  useEffect(() => {
    if (isOpen && commande) {
      (async () => {
        try {
          setError(null);
          const [platsRes, boissonsRes] = await Promise.all([
            fetch("/api/restaurant/repas"),
            fetch("/api/bar/boissons"),
          ]);
          
          if (!platsRes.ok || !boissonsRes.ok) {
            throw new Error("Erreur lors du chargement des données");
          }

          const platsData = await platsRes.json();
          const boissonsData = await boissonsRes.json();

          setPlats(platsData || []);
          setBoissons(boissonsData || []);
          
          // Initialiser le formulaire avec les données de la commande
          setForm({
            items: commande.details?.map((d: any) => ({
              repas_id: d.repas_id,
              quantite: d.quantite || 1,
              repas_nom: d.repas?.nom,
            })) || [],
            items_boissons: commande.boissons?.map((b: any) => ({
              boisson_id: b.boisson_id,
              quantite: b.quantite || 1,
              boisson_nom: b.boisson?.nom,
            })) || [],
          });
        } catch (err: any) {
          console.error("Erreur lors du chargement:", err);
          setError(err.message || "Erreur lors du chargement des données");
          // Utiliser les données de la commande même en cas d'erreur
          setForm({
            items: commande.details?.map((d: any) => ({
              repas_id: d.repas_id,
              quantite: d.quantite || 1,
              repas_nom: d.repas?.nom,
            })) || [],
            items_boissons: commande.boissons?.map((b: any) => ({
              boisson_id: b.boisson_id,
              quantite: b.quantite || 1,
              boisson_nom: b.boisson?.nom,
            })) || [],
          });
        }
      })();
    }
  }, [isOpen, commande]);

  if (!isOpen || !commande) return null;

  const addPlat = (repas_id: number) => {
    const existing = form.items.find((i) => i.repas_id === repas_id);
    if (existing) {
      updatePlatQty(repas_id, existing.quantite + 1);
    } else {
      const plat = plats.find((p) => p.id === repas_id);
      setForm({
        ...form,
        items: [...form.items, { repas_id, quantite: 1, repas_nom: plat?.nom }],
      });
    }
  };

  const removePlat = (repas_id: number) => {
    setForm({ ...form, items: form.items.filter((i) => i.repas_id !== repas_id) });
  };

  const updatePlatQty = (repas_id: number, quantite: number) => {
    if (quantite <= 0) {
      removePlat(repas_id);
      return;
    }
    setForm({
      ...form,
      items: form.items.map((i) => (i.repas_id === repas_id ? { ...i, quantite } : i)),
    });
  };

  const addBoisson = (boisson_id: number) => {
    const existing = form.items_boissons.find((i) => i.boisson_id === boisson_id);
    if (existing) {
      updateBoissonQty(boisson_id, existing.quantite + 1);
    } else {
      const boisson = boissons.find((b) => b.id === boisson_id);
      setForm({
        ...form,
        items_boissons: [...form.items_boissons, { boisson_id, quantite: 1, boisson_nom: boisson?.nom }],
      });
    }
  };

  const removeBoisson = (boisson_id: number) => {
    setForm({ ...form, items_boissons: form.items_boissons.filter((i) => i.boisson_id !== boisson_id) });
  };

  const updateBoissonQty = (boisson_id: number, quantite: number) => {
    if (quantite <= 0) {
      removeBoisson(boisson_id);
      return;
    }
    setForm({
      ...form,
      items_boissons: form.items_boissons.map((i) => (i.boisson_id === boisson_id ? { ...i, quantite } : i)),
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.items.length === 0 && form.items_boissons.length === 0) {
      setError("Ajoutez au moins un plat ou une boisson");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/restaurant/commandes/${commande.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: form.items.map((i) => ({ repas_id: i.repas_id, quantite: i.quantite })),
          items_boissons: form.items_boissons.length > 0 
            ? form.items_boissons.map((i) => ({ boisson_id: i.boisson_id, quantite: i.quantite }))
            : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la modification");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Erreur lors de la modification:", err);
      setError(err.message || "Erreur lors de la modification");
    } finally {
      setLoading(false);
    }
  };

  const selectedPlats = form.items.map((it) => ({
    ...it,
    plat: plats.find((p) => p.id === it.repas_id),
  })).filter((s) => s.plat);

  const selectedBoissons = form.items_boissons.map((it) => ({
    ...it,
    boisson: boissons.find((b) => b.id === it.boisson_id),
  })).filter((s) => s.boisson);

  const sousTotalPlats = selectedPlats.reduce(
    (acc, s) => acc + (s.plat ? Number(s.plat.prix || 0) * s.quantite : 0),
    0
  );
  const sousTotalBoissons = selectedBoissons.reduce(
    (acc, s) => acc + (s.boisson ? Number(s.boisson.prix_vente || 0) * s.quantite : 0),
    0
  );
  const total = sousTotalPlats + sousTotalBoissons;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* En-tête */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Modifier la commande #{commande.id}</h3>
            <p className="text-sm text-gray-500 mt-1">Modifiez les plats et boissons de la commande</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Panneau gauche - Liste des plats et boissons */}
          <div className="flex-1 p-6 overflow-y-auto border-b lg:border-b-0 lg:border-r border-gray-200">
            {/* Onglets */}
            <div className="mb-6 flex gap-2 border-b border-gray-200">
              <button
                type="button"
                onClick={() => setActiveTab("plats")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "plats"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Plats
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("boissons")}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "boissons"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Boissons
              </button>
            </div>

            {/* Liste des plats ou boissons */}
            <div className="space-y-3">
              {activeTab === "plats" ? (
                plats.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">Aucun plat disponible</div>
                ) : (
                  plats.map((p) => {
                    const quantiteAjoutee = form.items.find((i) => i.repas_id === p.id)?.quantite ?? 0;
                    return (
                      <div key={p.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{p.nom}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              {Number(p.prix ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {quantiteAjoutee > 0 && (
                              <div className="px-2.5 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded">
                                {quantiteAjoutee} ×
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => addPlat(p.id)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                              </svg>
                              Ajouter
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                boissons.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">Aucune boisson disponible</div>
                ) : (
                  boissons.map((b) => {
                    const quantiteAjoutee = form.items_boissons.find((i) => i.boisson_id === b.id)?.quantite ?? 0;
                    return (
                      <div key={b.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{b.nom}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              {Number(b.prix_vente ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
                              {b.stock !== undefined && <span className="ml-2 text-gray-500">• Stock: {Number(b.stock).toFixed(2)}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {quantiteAjoutee > 0 && (
                              <div className="px-2.5 py-1 bg-green-50 text-green-700 text-sm font-medium rounded">
                                {quantiteAjoutee} ×
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => addBoisson(b.id)}
                              disabled={b.stock !== undefined && Number(b.stock) <= 0}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                              </svg>
                              Ajouter
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )
              )}
            </div>
          </div>

          {/* Panneau droit - Détails de la commande */}
          <div className="w-full lg:w-[400px] bg-gray-50 flex flex-col">
            <div className="p-6 flex-1 overflow-y-auto">
              <h4 className="text-base font-semibold text-gray-900 mb-4">Détails de la commande</h4>
              
              {selectedPlats.length === 0 && selectedBoissons.length === 0 ? (
                <div className="py-8 text-center text-gray-500">Aucun article ajouté</div>
              ) : (
                <div className="space-y-3">
                  {/* Plats */}
                  {selectedPlats.map((s) => (
                    <div key={`plat-${s.repas_id}`} className="bg-white rounded-lg border border-gray-200 p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="font-medium text-sm text-gray-900 flex-1">
                          <span className="text-blue-600 font-semibold">🍽️</span> {s.plat?.nom}
                        </div>
                        <div className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                          {Number(s.plat?.prix || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updatePlatQty(s.repas_id, s.quantite - 1)}
                            className="px-2.5 py-1.5 hover:bg-gray-100 text-gray-700 text-sm font-medium transition-colors"
                          >
                            −
                          </button>
                          <div className="px-3 py-1.5 text-sm font-medium text-gray-900 min-w-[2rem] text-center">{s.quantite}</div>
                          <button
                            type="button"
                            onClick={() => updatePlatQty(s.repas_id, s.quantite + 1)}
                            className="px-2.5 py-1.5 hover:bg-gray-100 text-gray-700 text-sm font-medium transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePlat(s.repas_id)}
                          className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* Boissons */}
                  {selectedBoissons.map((s) => (
                    <div key={`boisson-${s.boisson_id}`} className="bg-white rounded-lg border border-green-200 p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="font-medium text-sm text-gray-900 flex-1">
                          <span className="text-green-600 font-semibold">🥤</span> {s.boisson?.nom}
                        </div>
                        <div className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                          {Number(s.boisson?.prix_vente || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updateBoissonQty(s.boisson_id, s.quantite - 1)}
                            className="px-2.5 py-1.5 hover:bg-gray-100 text-gray-700 text-sm font-medium transition-colors"
                          >
                            −
                          </button>
                          <div className="px-3 py-1.5 text-sm font-medium text-gray-900 min-w-[2rem] text-center">{s.quantite}</div>
                          <button
                            type="button"
                            onClick={() => updateBoissonQty(s.boisson_id, s.quantite + 1)}
                            className="px-2.5 py-1.5 hover:bg-gray-100 text-gray-700 text-sm font-medium transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeBoisson(s.boisson_id)}
                          className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer avec total et boutons */}
            <div className="border-t border-gray-200 bg-white sticky bottom-0">
              {(selectedPlats.length > 0 || selectedBoissons.length > 0) && (
                <div className="p-4 border-b border-gray-200">
                  {selectedPlats.length > 0 && (
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-600">Sous-total plats</div>
                      <div className="text-sm font-medium text-gray-900">
                        {sousTotalPlats.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
                      </div>
                    </div>
                  )}
                  {selectedBoissons.length > 0 && (
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-600">Sous-total boissons</div>
                      <div className="text-sm font-medium text-gray-900">
                        {sousTotalBoissons.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 mt-2">
                    <div className="text-base font-semibold text-gray-900">Total</div>
                    <div className="text-base font-bold text-gray-900">
                      {total.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="px-4 py-3 bg-red-50 border-b border-red-100">
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span className="break-words">{error}</span>
                  </div>
                </div>
              )}

              <div className="p-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading || (selectedPlats.length === 0 && selectedBoissons.length === 0)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${loading || (selectedPlats.length === 0 && selectedBoissons.length === 0)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'}
                  `}
                >
                  {loading ? "Modification..." : "Enregistrer les modifications"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

