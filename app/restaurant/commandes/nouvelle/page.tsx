"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NouvelleCommandePage() {
  const router = useRouter();
  const [plats, setPlats] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [table_numero, setTable] = useState("");
  const [items, setItems] = useState<{ repas_id: number; quantite: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/restaurant/repas");
      const data = await res.json();
      setPlats(data);
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
    setItems((s) => s.map((it) => (it.repas_id === repas_id ? { ...it, quantite: Math.max(1, qty) } : it)));
  };

  const removeItem = (repas_id: number) => setItems((s) => s.filter((i) => i.repas_id !== repas_id));

    const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validation des entrées
    if (items.length === 0) return setError('Ajoutez au moins un plat');
    if (!table_numero) return setError('Le numéro de table est requis');
    
    setLoading(true);
    try {
      const res = await fetch("/api/restaurant/commandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table_numero, items }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        console.error('Erreur API:', data);
        if (data?.error?.fieldErrors) {
          const errors = Object.entries(data.error.fieldErrors)
            .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`)
            .join('\n');
          setError(`Erreurs de validation:\n${errors}`);
        } else if (data?.error) {
          setError(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
        } else {
          setError("Une erreur s'est produite lors de la création de la commande");
        }
        return;
      }
      
      router.push("/restaurant/commandes");
    } catch (err) {
      console.error('Erreur:', err);
      setError(`Erreur technique: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const filtered = plats.filter((p) => p.nom.toLowerCase().includes(query.toLowerCase()));
  const selectedDetails = items.map((it) => ({ ...it, plat: plats.find((p) => p.id === it.repas_id) }));
  const estimatedTotal = selectedDetails.reduce((acc, s) => acc + (s.plat ? Number(s.plat.prix || 0) * s.quantite : 0), 0);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <nav className="text-sm text-gray-500 mb-1">Restaurant / <span className="text-gray-700">Nouvelle commande</span></nav>
          <h1 className="text-3xl font-bold text-gray-900">Nouvelle commande</h1>
          <p className="text-sm text-gray-500 mt-1">Créez une commande rapidement en ajoutant des plats depuis le menu.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/restaurant/commandes')} className="flex items-center gap-2 px-4 py-2 border rounded-md text-sm bg-white hover:bg-gray-50">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            Retour
          </button>
          <button onClick={() => { setItems([]); setTable(''); setQuery(''); }} className="px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-md text-sm">Réinitialiser</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2">
          <div className="mb-4">
            <label className="block text-sm text-gray-700 mb-2">Rechercher un plat</label>
            <div className="flex gap-2">
              <input value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1 px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="Rechercher par nom..." />
              <button type="button" onClick={() => setQuery('')} className="px-4 py-3 bg-white border rounded-lg">Effacer</button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <article key={p.id} className="bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col justify-between">
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900">{p.nom}</h3>
                  <div className="mt-2 text-sm text-gray-500">{Number(p.prix).toFixed(2)} FC</div>
                </div>
                <div className="p-3 bg-gray-50 flex items-center justify-between">
                  <div className="text-xs text-gray-600">{items.find(i => i.repas_id === p.id)?.quantite || 0} sélectionné(s)</div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => addItem(p.id)} className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-md text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                      Ajouter
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="lg:col-span-1">
          <form onSubmit={submit} className="bg-white rounded-xl shadow p-4 lg:sticky lg:top-20">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Sélection</h4>
            {selectedDetails.length === 0 ? (
              <div className="text-sm text-gray-500">Aucun plat sélectionné</div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-auto">
                {selectedDetails.map((s) => (
                  <div key={s.repas_id} className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{s.plat?.nom}</div>
                      <div className="text-xs text-gray-500">{Number(s.plat?.prix || 0).toFixed(2)} FC</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => updateQty(s.repas_id, s.quantite - 1)} className="px-2 py-1 bg-white border rounded">-</button>
                      <div className="px-3">{s.quantite}</div>
                      <button type="button" onClick={() => updateQty(s.repas_id, s.quantite + 1)} className="px-2 py-1 bg-white border rounded">+</button>
                      <button type="button" onClick={() => removeItem(s.repas_id)} className="text-red-600 px-2">Suppr</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t mt-4">
              <div className="flex items-center justify-between text-sm text-gray-700 mb-2">
                <div>Total estimé</div>
                <div className="font-semibold text-gray-900">{Number(estimatedTotal).toFixed(2)} FC</div>
              </div>

              <div className="mb-3">
                <label className="block text-sm mb-1">Table</label>
                <input className="w-full border rounded px-3 py-2" value={table_numero} onChange={(e) => setTable(e.target.value)} required />
              </div>

              {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

              <div className="flex justify-between gap-2">
                <button type="button" onClick={() => router.push('/restaurant/commandes')} className="flex-1 px-3 py-2 bg-white border rounded">Annuler</button>
                <button type="submit" className="flex-1 px-3 py-2 bg-blue-600 text-white rounded" disabled={loading}>{loading ? 'Envoi...' : 'Créer la commande'}</button>
              </div>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}


