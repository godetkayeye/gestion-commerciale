"use client";

import React, { useEffect, useState } from "react";

type Plat = { id: number; nom: string; prix?: number | string; disponible?: boolean };
type Table = { id: number; numero: string; capacite: number; statut: string };

export default function CreateCommandeModal({ open, onCloseAction, onCreatedAction }: { open: boolean; onCloseAction?: () => void; onCreatedAction?: (cmd?: any) => void }) {
  const [plats, setPlats] = useState<Plat[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [table, setTable] = useState("");
  const [items, setItems] = useState<{ repas_id: number; quantite: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) {
      setQuery("");
      setItems([]);
      setTable("");
      setError(null);
      return;
    }
    (async () => {
      try {
        const [repasRes, tablesRes] = await Promise.all([
          fetch("/api/restaurant/repas"),
          fetch("/api/restaurant/tables")
        ]);
        const repasData = await repasRes.json();
        const tablesData = await tablesRes.json();
        setPlats(repasData || []);
        setTables(tablesData || []);
      } catch (err) {
        setPlats([]);
        setTables([]);
      }
    })();
  }, [open]);

  const addItem = (repas_id: number) => {
    setItems((prev) => {
      const ex = prev.find((i) => i.repas_id === repas_id);
      if (ex) return prev.map((i) => (i.repas_id === repas_id ? { ...i, quantite: i.quantite + 1 } : i));
      return [...prev, { repas_id, quantite: 1 }];
    });
  };

  const updateQty = (repas_id: number, qty: number) => {
    if (qty <= 0) {
      removeItem(repas_id);
      return;
    }
    setItems((s) => s.map((it) => (it.repas_id === repas_id ? { ...it, quantite: qty } : it)));
  };

  const removeItem = (repas_id: number) => setItems((s) => s.filter((i) => i.repas_id !== repas_id));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (items.length === 0) return setError("Ajoutez au moins un plat");
    if (!table || table.trim() === "") return setError("Veuillez spécifier le numéro de table");
    setLoading(true);
    try {
      const res = await fetch("/api/restaurant/commandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table_numero: table, items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur lors de la création");
      onCreatedAction?.(data);
      setTable("");
      setItems([]);
      setQuery("");
      onCloseAction?.();
    } catch (err: any) {
      setError(err?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const filtered = plats.filter((p) => p.nom.toLowerCase().includes(query.toLowerCase()) && (p.disponible !== false));
  const selectedDetails = items.map((it) => ({ ...it, plat: plats.find((p) => p.id === it.repas_id) })).filter(s => s.plat);
  const sousTotal = selectedDetails.reduce((acc, s) => acc + (s.plat ? Number(s.plat.prix || 0) * s.quantite : 0), 0);
  const total = sousTotal;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onCloseAction?.()} />
      
      {/* Modal */}
      <div className="relative z-10 w-full sm:max-w-6xl bg-white rounded-none sm:rounded-xl shadow-2xl overflow-hidden min-h-screen sm:min-h-0 sm:max-h-[90vh] flex flex-col my-0 sm:my-auto">
        {/* En-tête du modal */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Nouvelle commande</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 hidden sm:block">Sélectionnez les plats et spécifiez la quantité</p>
          </div>
          <button 
            onClick={() => onCloseAction?.()} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 ml-2"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Panneau gauche - Liste des plats */}
          <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto border-b lg:border-b-0 lg:border-r border-gray-200">
            {/* Barre de recherche */}
            <div className="mb-4 sm:mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </div>
                <input 
                  type="text"
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)} 
                  className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                  placeholder="Rechercher un plat..."
                />
              </div>
            </div>

            {/* Liste des plats */}
            <div className="space-y-2 sm:space-y-3">
              {filtered.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="text-sm sm:text-base text-gray-500">Aucun plat disponible</div>
                </div>
              ) : (
                filtered.map((p) => {
                  const quantiteAjoutee = items.find(i => i.repas_id === p.id)?.quantite ?? 0;
                  return (
                    <div 
                      key={p.id} 
                      className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm sm:text-base text-gray-900 truncate">{p.nom}</div>
                          <div className="text-xs sm:text-sm text-gray-600 mt-1">{Number(p.prix ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC</div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                          {quantiteAjoutee > 0 && (
                            <div className="px-2 sm:px-2.5 py-1 bg-blue-50 text-blue-700 text-xs sm:text-sm font-medium rounded">
                              {quantiteAjoutee} ×
                            </div>
                          )}
                          <button 
                            type="button" 
                            onClick={() => addItem(p.id)} 
                            className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                          >
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                            </svg>
                            <span className="hidden sm:inline">Ajouter</span>
                            <span className="sm:hidden">+</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Panneau droit - Détails de la commande */}
          <div className="w-full lg:w-[400px] bg-gray-50 flex flex-col">
            <div className="p-3 sm:p-4 lg:p-6 flex-1 overflow-y-auto">
              <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">Détails de la commande</h4>
              
              {/* Champ numéro de table */}
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <label className="block text-xs sm:text-sm font-bold text-blue-900 mb-2 sm:mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                  <span className="truncate">Numéro de table <span className="text-red-500">*</span></span>
                </label>
                {tables.length === 0 ? (
                  <div className="p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-xs text-yellow-800 font-medium">Aucune table disponible</div>
                    <div className="text-xs text-yellow-700 mt-1">Veuillez créer des tables d'abord dans la section "Gestion des tables"</div>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={table} 
                      onChange={(e) => setTable(e.target.value)} 
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 pr-10 sm:pr-12 border-2 border-blue-400 rounded-lg text-sm sm:text-base font-semibold text-gray-900 focus:ring-2 sm:focus:ring-4 focus:ring-blue-300 focus:border-blue-600 outline-none transition-all bg-white appearance-none cursor-pointer hover:border-blue-500 shadow-sm" 
                      required
                    >
                      <option value="" className="text-gray-500 font-normal">Sélectionnez une table</option>
                      {tables.map((t) => (
                        <option key={t.id} value={t.numero} className="text-gray-900 font-medium">
                          Table {t.numero} {t.statut === "LIBRE" ? "• Libre" : t.statut === "OCCUPEE" ? "• Occupée" : "• En attente"}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-4 pointer-events-none">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </div>
                  </div>
                )}
              </div>

              {/* Liste des plats ajoutés */}
              {selectedDetails.length === 0 ? (
                <div className="py-6 sm:py-8 text-center">
                  <div className="text-xs sm:text-sm text-gray-500">Aucun plat ajouté</div>
                  <div className="text-xs text-gray-400 mt-1 hidden sm:block">Ajoutez des plats depuis le menu</div>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {selectedDetails.map((s) => (
                    <div key={s.repas_id} className="bg-white rounded-lg border border-gray-200 p-2.5 sm:p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="font-medium text-xs sm:text-sm text-gray-900 flex-1 min-w-0 truncate">{s.plat?.nom}</div>
                        <div className="text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">
                          {Number(s.plat?.prix || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                          <button 
                            type="button" 
                            onClick={() => updateQty(s.repas_id, s.quantite - 1)}
                            className="px-2 sm:px-2.5 py-1 sm:py-1.5 hover:bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium transition-colors"
                          >
                            −
                          </button>
                          <div className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-900 min-w-[2rem] text-center">{s.quantite}</div>
                          <button 
                            type="button" 
                            onClick={() => updateQty(s.repas_id, s.quantite + 1)}
                            className="px-2 sm:px-2.5 py-1 sm:py-1.5 hover:bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeItem(s.repas_id)}
                          className="p-1 sm:p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors flex-shrink-0"
                          aria-label="Supprimer"
                        >
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              {selectedDetails.length > 0 && (
                <div className="p-3 sm:p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <div className="text-xs sm:text-sm text-gray-600">Sous-total</div>
                    <div className="text-xs sm:text-sm font-medium text-gray-900">{sousTotal.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm sm:text-base font-semibold text-gray-900">Total</div>
                    <div className="text-sm sm:text-base font-bold text-gray-900">{total.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC</div>
                  </div>
                </div>
              )}

              {error && (
                <div className="px-3 sm:px-4 py-2 sm:py-3 bg-red-50 border-b border-red-100">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span className="break-words">{error}</span>
                  </div>
                </div>
              )}

              <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
                <button 
                  type="button" 
                  onClick={() => onCloseAction?.()} 
                  className="px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={loading || selectedDetails.length === 0 || !table || table.trim() === ""} 
                  className={`
                    px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors
                    ${loading || selectedDetails.length === 0 || !table || table.trim() === ""
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'}
                  `}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      <span className="hidden sm:inline">Création...</span>
                      <span className="sm:hidden">...</span>
                    </span>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Créer la commande</span>
                      <span className="sm:hidden">Créer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
