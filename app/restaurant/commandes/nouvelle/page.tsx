"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NouvelleCommandePage() {
  const router = useRouter();
  const [plats, setPlats] = useState<any[]>([]);
  const [table_numero, setTable] = useState("");
  const [items, setItems] = useState<{ repas_id: number; quantite: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/restaurant/commandes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table_numero, items }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ? JSON.stringify(data.error) : "Erreur");
      return;
    }
    router.push("/restaurant/commandes");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Nouvelle commande</h1>
      <form onSubmit={submit} className="space-y-4 bg-white border rounded p-4">
        <div>
          <label className="block text-sm mb-1">Table</label>
          <input className="border rounded px-3 py-2" value={table_numero} onChange={(e) => setTable(e.target.value)} required />
        </div>
        <div>
          <div className="text-sm mb-2">Plats</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {plats.map((p) => (
              <button key={p.id} type="button" onClick={() => addItem(p.id)} className="border rounded p-2 text-left hover:bg-blue-50">
                <div className="font-medium">{p.nom}</div>
                <div className="text-sm text-gray-600">{Number(p.prix).toFixed(2)}</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm mb-2">Sélection</div>
          {items.length === 0 ? (
            <div className="text-sm text-gray-500">Aucun plat.</div>
          ) : (
            <ul className="text-sm list-disc pl-5">
              {items.map((i) => {
                const plat = plats.find((p) => p.id === i.repas_id);
                return (
                  <li key={i.repas_id}>
                    {plat?.nom} × {i.quantite}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="px-3 py-2 bg-blue-600 text-white rounded">Créer</button>
      </form>
    </div>
  );
}


