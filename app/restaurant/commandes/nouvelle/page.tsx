"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Plat = { id: number; nom: string; prix: number | string; disponible?: boolean };
type Table = { id: number; numero: string; capacite: number; statut: string };

export default function NouvelleCommandePage() {
  const router = useRouter();
  const [plats, setPlats] = useState<Plat[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [table_numero, setTable] = useState("");
  const [items, setItems] = useState<{ repas_id: number; quantite: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [repasRes, tablesRes] = await Promise.all([
          fetch("/api/restaurant/repas"),
          fetch("/api/restaurant/tables")
        ]);
        const repasData = await repasRes.json();
        const tablesData = await tablesRes.json();
        setPlats((repasData || []).filter((p: Plat) => p.disponible !== false));
        setTables(tablesData || []);
      } catch (err) {
        setPlats([]);
        setTables([]);
      }
    })();
  }, []);

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
    
    // Plus besoin de vérifier la table, elle sera générée automatiquement
    if (items.length === 0) {
      setError("Veuillez ajouter au moins un plat");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/restaurant/commandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }), // table_numero sera généré automatiquement côté serveur
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Erreur lors de la création");
      }
      router.push("/restaurant/commandes");
    } catch (err: any) {
      setError(err?.message || "Erreur");
      setLoading(false);
    }
  };

  const selectedDetails = items.map((it) => ({ 
    ...it, 
    plat: plats.find((p) => p.id === it.repas_id) 
  })).filter(s => s.plat);

  const total = selectedDetails.reduce((acc, s) => acc + (s.plat ? Number(s.plat.prix || 0) * s.quantite : 0), 0);

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/restaurant/commandes"
            className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900 flex-shrink-0"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Nouvelle commande</h1>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* Info table automatique */}
        <div className="bg-green-50 rounded-xl border-2 border-green-200 shadow-sm p-4 sm:p-6">
          <label className="block text-sm sm:text-base font-bold text-green-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Table assignée automatiquement
          </label>
          <div className="p-3 bg-white border border-green-200 rounded-lg">
            <div className="text-sm text-green-800 font-medium">
              Une nouvelle table sera automatiquement créée pour cette commande
            </div>
            <div className="text-xs text-green-700 mt-1">
              La table sera numérotée selon l'ordre de création (Commande 1 = Table 1, Commande 2 = Table 2, etc.)
            </div>
          </div>
        </div>

        {/* Section Plats */}
        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-4 sm:p-6">
          <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-4 sm:mb-6">Plats</h2>
          {plats.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="text-sm sm:text-base text-gray-500">Aucun plat disponible</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {plats.map((p) => {
                const quantiteAjoutee = items.find(i => i.repas_id === p.id)?.quantite ?? 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addItem(p.id)}
                    className="relative bg-white border-2 border-gray-200 rounded-lg p-4 sm:p-5 text-left hover:border-blue-400 hover:shadow-md transition-all group"
                  >
                    <div className="font-semibold text-sm sm:text-base text-gray-900 mb-2">{p.nom}</div>
                    <div className="text-sm sm:text-base font-bold text-blue-700">
                      {Number(p.prix).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
                    </div>
                    {quantiteAjoutee > 0 && (
                      <div className="absolute top-2 right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs sm:text-sm font-bold">
                        {quantiteAjoutee}
                      </div>
                    )}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="inline-flex items-center gap-1.5 text-xs text-gray-500 group-hover:text-blue-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                        </svg>
                        <span>Ajouter</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Section Sélection */}
        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-4 sm:p-6">
          <h2 className="text-sm sm:text-base font-bold text-gray-900 mb-4 sm:mb-6">Sélection</h2>
          {selectedDetails.length === 0 ? (
            <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <div className="text-sm sm:text-base text-gray-500 font-medium">Aucun plat.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDetails.map((s) => (
                <div key={s.repas_id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm sm:text-base text-gray-900 truncate">{s.plat?.nom}</div>
                    <div className="text-xs sm:text-sm text-gray-600 mt-1">
                      {Number(s.plat?.prix || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC × {s.quantite}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 ml-3">
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                      <button
                        type="button"
                        onClick={() => updateQty(s.repas_id, s.quantite - 1)}
                        className="px-2 sm:px-3 py-1.5 hover:bg-gray-100 text-gray-700 text-sm font-medium transition-colors"
                      >
                        −
                      </button>
                      <div className="px-3 sm:px-4 py-1.5 text-sm font-semibold text-gray-900 min-w-[2.5rem] text-center bg-white">
                        {s.quantite}
                      </div>
                      <button
                        type="button"
                        onClick={() => updateQty(s.repas_id, s.quantite + 1)}
                        className="px-2 sm:px-3 py-1.5 hover:bg-gray-100 text-gray-700 text-sm font-medium transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(s.repas_id)}
                      className="p-1.5 sm:p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors flex-shrink-0"
                      aria-label="Supprimer"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              {selectedDetails.length > 0 && (
                <div className="pt-3 sm:pt-4 border-t border-gray-200 mt-3 sm:mt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm sm:text-base font-semibold text-gray-900">Total</div>
                    <div className="text-lg sm:text-xl font-bold text-gray-900">
                      {total.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-red-700 font-medium">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Bouton Créer */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/restaurant/commandes"
            className="px-4 sm:px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading || selectedDetails.length === 0}
            className={`px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white rounded-lg transition-colors ${
              loading || selectedDetails.length === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md'
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span className="hidden sm:inline">Création en cours...</span>
                <span className="sm:hidden">Création...</span>
              </span>
            ) : (
              'Créer'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
