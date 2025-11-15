"use client";

import React, { useState } from "react";

type Table = { id: number; numero: string; capacite: number; statut: string };
type Commande = {
  id: number;
  total: number;
  date_commande: string;
  details: Array<{
    id: number;
    repas_id: number;
    quantite: number;
    prix_total: number;
  }>;
};

export default function TablesClient({ initialTables }: { initialTables: Table[] }) {
  const [tables, setTables] = useState<Table[]>(initialTables || []);
  const [numero, setNumero] = useState("");
  const [capacite, setCapacite] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // État pour la modal d'historique
  const [showHistory, setShowHistory] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [historyData, setHistoryData] = useState<Commande[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  async function createTable(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!numero) return setError("Le numéro est requis");
    setLoading(true);
    try {
      const res = await fetch(`/api/restaurant/tables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero, capacite }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur");
      setTables((t) => [data, ...t]);
      setNumero("");
      setCapacite(1);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: number, statut: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/restaurant/tables/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur");
      setTables((t) => t.map((x) => (x.id === id ? data : x)));
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function removeTable(id: number) {
    if (!confirm("Supprimer cette table ?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/restaurant/tables/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur");
      setTables((t) => t.filter((x) => x.id !== id));
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory(table: Table) {
    setSelectedTable(table);
    setShowHistory(true);
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/restaurant/tables/${table.id}/history`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur lors du chargement de l'historique");
      setHistoryData(data.commandes || []);
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoadingHistory(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
        <form onSubmit={createTable} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="font-medium text-gray-900 mb-3">Nouvelle table</div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro</label>
              <input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="ex: A1, 101..." 
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-shadow" />
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacité</label>
              <input type="number" value={capacite} onChange={(e) => setCapacite(Number(e.target.value))} min={1}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-shadow" />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={loading} 
                className="h-[42px] px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                {loading ? '...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </form>

        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {tables.map((t) => (
            <div key={t.id} className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">Table {t.numero}</div>
                    <div className="text-sm text-gray-600">{t.capacite} place{t.capacite > 1 ? 's' : ''}</div>
                  </div>
                  <select value={t.statut} onChange={(e) => updateStatus(t.id, e.target.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border-0 focus:ring-2 focus:ring-blue-100 outline-none
                      ${t.statut?.toLowerCase() === 'libre' ? 'bg-green-50 text-green-700' :
                      t.statut?.toLowerCase() === 'occupee' ? 'bg-red-50 text-red-700' :
                      'bg-yellow-50 text-yellow-700'}`}>
                    <option value="libre">Libre</option>
                    <option value="occupee">Occupée</option>
                    <option value="en_attente">En attente</option>
                  </select>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button onClick={() => loadHistory(t)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                    Historique
                  </button>
                  <button onClick={() => removeTable(t.id)} 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
          {tables.length === 0 && (
            <div className="sm:col-span-2 bg-gray-50 rounded-xl p-8 text-center">
              <div className="text-gray-500 mb-1">Aucune table n'a été créée</div>
              <div className="text-sm text-gray-400">Créez votre première table en utilisant le formulaire ci-dessus</div>
            </div>
          )}
        </div>
        </div>

      <aside className="hidden lg:block">
        <div className="bg-blue-50 rounded-xl p-4">
          <h4 className="text-base font-semibold text-blue-900">Guide rapide</h4>
          <ul className="mt-3 space-y-2 text-sm text-blue-700">
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>Créez des tables en spécifiant leur numéro et capacité</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>Changez le statut des tables selon leur occupation</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>Consultez l'historique des commandes par table</span>
            </li>
          </ul>
        </div>
      </aside>
    </div>

    {/* Modal d'historique */}
    {showHistory && selectedTable && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Historique — Table {selectedTable.numero}</h3>
              <div className="text-sm text-gray-500 mt-1">Liste des commandes passées sur cette table</div>
            </div>
            <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-100 rounded-lg">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingHistory ? (
              <div className="p-8 text-center">
                <div className="text-gray-500">Chargement de l'historique...</div>
              </div>
            ) : historyData.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-500">Aucune commande pour cette table</div>
                <div className="text-sm text-gray-400 mt-1">Les commandes apparaîtront ici une fois créées</div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {historyData.map((c) => (
                  <div key={c.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium text-gray-900">Commande #{c.id}</div>
                        <div className="text-sm text-gray-500">{new Date(c.date_commande || '').toLocaleString()}</div>
                      </div>
                      <div className="text-lg font-semibold text-gray-900">{Number(c.total || 0).toFixed(2)} FC</div>
                    </div>
                    <div className="mt-3 space-y-2">
                      {c.details.map((d) => (
                        <div key={d.id} className="flex items-center justify-between text-sm">
                          <div className="text-gray-700">{d.repas_id ? `Repas #${d.repas_id}` : 'Article'}</div>
                          <div className="text-gray-600">
                            <span className="font-medium">x{d.quantite}</span>
                            <span className="mx-2">—</span>
                            <span>{Number(d.prix_total).toFixed(2)} FC</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
            <button onClick={() => setShowHistory(false)} 
              className="w-full px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 transition-colors">
              Fermer
            </button>
          </div>
        </div>
      </div>
    )}
  </>
);
}
