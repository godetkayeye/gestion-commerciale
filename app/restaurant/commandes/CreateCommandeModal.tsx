"use client";

import React, { useEffect, useState } from "react";

type Plat = { id: number; nom: string; prix?: number };

export default function CreateCommandeModal({ open, onCloseAction, onCreatedAction }: { open: boolean; onCloseAction?: () => void; onCreatedAction?: (cmd?: any) => void }) {
  const [plats, setPlats] = useState<Plat[]>([]);
  const [table, setTable] = useState("");
  const [items, setItems] = useState<{ repas_id: number; quantite: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await fetch("/api/restaurant/repas");
        const data = await res.json();
        setPlats(data || []);
      } catch (err) {
        setPlats([]);
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
    setItems((s) => s.map((it) => (it.repas_id === repas_id ? { ...it, quantite: Math.max(1, qty) } : it)));
  };

  const removeItem = (repas_id: number) => setItems((s) => s.filter((i) => i.repas_id !== repas_id));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (items.length === 0) return setError("Ajoutez au moins un plat");
    setLoading(true);
      try {
        const res = await fetch("/api/restaurant/commandes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table_numero: table, items }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Erreur lors de la création");
        // notify parent
      onCreatedAction?.(data);
        // reset
        setTable("");
        setItems([]);
      onCloseAction?.();
    } catch (err: any) {
      setError(err?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const filtered = plats.filter((p) => p.nom.toLowerCase().includes(query.toLowerCase()));
  const selectedDetails = items.map((it) => ({ ...it, plat: plats.find((p) => p.id === it.repas_id) }));
  const estimatedTotal = selectedDetails.reduce((acc, s) => acc + (s.plat ? Number(s.plat.prix || 0) * s.quantite : 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6">
      <div className="fixed inset-0" onClick={() => onCloseAction?.()} />
      <div className="relative z-10 w-full max-w-5xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col mt-8">
        {/* En-tête du modal */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Nouvelle commande</h3>
            <p className="text-sm text-gray-500 mt-1">Sélectionnez les plats et spécifiez la quantité</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
              </div>
              <input 
                value={table} 
                onChange={(e) => setTable(e.target.value)} 
                placeholder="Numéro de table" 
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all" 
                aria-label="Numéro de table"
              />
            </div>
            <button 
              onClick={() => onCloseAction?.()} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Section gauche - Liste des plats */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </div>
                <input 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)} 
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all" 
                  placeholder="Rechercher un plat par nom..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p) => (
                <div 
                  key={p.id} 
                  className="group relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all overflow-hidden"
                >
                  <div className="p-4">
                    <div className="font-medium text-gray-900">{p.nom}</div>
                    <div className="text-sm text-gray-600 mt-1">{Number(p.prix ?? 0).toFixed(2)} FC</div>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <button 
                        type="button" 
                        onClick={() => addItem(p.id)} 
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                        </svg>
                        Ajouter
                      </button>
                      {(items.find(i => i.repas_id === p.id)?.quantite ?? 0) > 0 && (
                        <div className="px-2.5 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg">
                          {(items.find(i => i.repas_id === p.id)?.quantite ?? 0)} ×
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {filtered.length === 0 && (
                <div className="col-span-full p-8 text-center">
                  <div className="text-gray-500">Aucun plat ne correspond à votre recherche</div>
                </div>
              )}
            </div>
          </div>

          {/* Section droite - Résumé de la commande */}
          <div className="w-full lg:w-[380px] border-t lg:border-t-0 lg:border-l border-gray-100 bg-gray-50 flex flex-col">
            <div className="p-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Détails de la commande</h4>
              
              {selectedDetails.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                  </div>
                  <div className="text-sm text-gray-500">Votre commande est vide</div>
                  <div className="text-xs text-gray-400 mt-1">Ajoutez des plats depuis le menu</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDetails.map((s) => (
                    <div key={s.repas_id} className="flex items-start gap-3 py-2">
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-medium text-gray-900">{s.plat?.nom}</div>
                          <div className="text-sm font-medium text-gray-900">
                            {Number(s.plat?.prix || 0).toFixed(2)} FC
                          </div>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden">
                            <button 
                              type="button" 
                              onClick={() => updateQty(s.repas_id, s.quantite - 1)}
                              className="px-2 py-1 hover:bg-gray-100 text-gray-600"
                            >−</button>
                            <div className="px-3 py-1 text-sm font-medium text-gray-900">{s.quantite}</div>
                            <button 
                              type="button" 
                              onClick={() => updateQty(s.repas_id, s.quantite + 1)}
                              className="px-2 py-1 hover:bg-gray-100 text-gray-600"
                            >+</button>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => removeItem(s.repas_id)}
                            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer avec total et boutons d'action */}
            <div className="mt-auto border-t border-gray-200">
              {selectedDetails.length > 0 && (
                <div className="p-4 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-600">Sous-total</div>
                    <div className="font-medium text-gray-900">{Number(estimatedTotal).toFixed(2)} FC</div>
                  </div>
                  <div className="flex items-center justify-between font-medium">
                    <div className="text-sm text-gray-900">Total</div>
                    <div className="text-lg text-gray-900">{Number(estimatedTotal).toFixed(2)} FC</div>
                  </div>
                </div>
              )}

              {error && (
                <div className="px-4 py-3 bg-red-50 border-y border-red-100">
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {error}
                  </div>
                </div>
              )}

              <div className="p-4 bg-white">
                <div className="flex items-center justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => onCloseAction?.()} 
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading || selectedDetails.length === 0} 
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium
                      ${loading || selectedDetails.length === 0 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'}
                      transition-colors
                    `}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        Création en cours...
                      </div>
                    ) : 'Créer la commande'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
