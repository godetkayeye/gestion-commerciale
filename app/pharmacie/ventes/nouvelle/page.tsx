"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function NouvelleVentePage() {
  const router = useRouter();
  const [produits, setProduits] = useState<any[]>([]);
  const [items, setItems] = useState<{ medicament_id: number; quantite: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [payer, setPayer] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/pharmacie/medicaments");
      const data = await res.json();
      setProduits(data);
    })();
  }, []);

  const addItem = (medicament_id: number) => {
    setItems((prev) => {
      const ex = prev.find((i) => i.medicament_id === medicament_id);
      if (ex) return prev.map((i) => (i.medicament_id === medicament_id ? { ...i, quantite: i.quantite + 1 } : i));
      return [...prev, { medicament_id, quantite: 1 }];
    });
  };

  const total = useMemo(() => {
    const prixById = new Map<number, number>();
    produits.forEach((p) => prixById.set(p.id, Number(p.prix_unitaire)));
    return items.reduce((acc, it) => acc + (prixById.get(it.medicament_id) ?? 0) * it.quantite, 0);
  }, [items, produits]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/pharmacie/ventes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, payer }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ? JSON.stringify(data.error) : "Erreur");
      return;
    }
    router.push("/pharmacie/ventes");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Nouvelle vente</h1>
      <form onSubmit={submit} className="space-y-4 bg-white border rounded p-4">
        <div>
          <div className="text-sm mb-2">Produits</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {produits.map((p) => (
              <button key={p.id} type="button" onClick={() => addItem(p.id)} className="border rounded p-2 text-left hover:bg-blue-50">
                <div className="font-medium">{p.nom}</div>
                <div className="text-sm text-gray-600">{Number(p.prix_unitaire).toFixed(2)} — stock {p.quantite_stock}</div>
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm mb-2">Sélection</div>
          {items.length === 0 ? (
            <div className="text-sm text-gray-500">Aucun produit.</div>
          ) : (
            <ul className="text-sm list-disc pl-5">
              {items.map((i) => {
                const prod = produits.find((p) => p.id === i.medicament_id);
                return (
                  <li key={i.medicament_id}>
                    {prod?.nom} × {i.quantite}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input id="payer" type="checkbox" checked={payer} onChange={(e) => setPayer(e.target.checked)} />
          <label htmlFor="payer" className="text-sm">Enregistrer le paiement (cash)</label>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-blue-700">Total: {total.toFixed(2)}</div>
          <button className="px-3 py-2 bg-blue-600 text-white rounded">Valider</button>
        </div>
      </form>
    </div>
  );
}


