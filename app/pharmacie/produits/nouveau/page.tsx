"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NouveauProduitPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nom: "", prix_unitaire: "", quantite_stock: "0", date_expiration: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/pharmacie/medicaments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom: form.nom,
        prix_unitaire: Number(form.prix_unitaire),
        quantite_stock: Number(form.quantite_stock),
        date_expiration: form.date_expiration || null,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ? JSON.stringify(data.error) : "Erreur");
      return;
    }
    router.push("/pharmacie/produits");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Nouveau produit</h1>
      <form onSubmit={submit} className="max-w-md space-y-4 bg-white border rounded p-4">
        <div>
          <label className="block text-sm mb-1">Nom</label>
          <input className="w-full border rounded px-3 py-2" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Prix unitaire</label>
          <input className="w-full border rounded px-3 py-2" type="number" step="0.01" value={form.prix_unitaire} onChange={(e) => setForm({ ...form, prix_unitaire: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Quantité en stock</label>
          <input className="w-full border rounded px-3 py-2" type="number" value={form.quantite_stock} onChange={(e) => setForm({ ...form, quantite_stock: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Date d'expiration</label>
          <input className="w-full border rounded px-3 py-2" type="date" value={form.date_expiration} onChange={(e) => setForm({ ...form, date_expiration: e.target.value })} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="px-3 py-2 bg-blue-600 text-white rounded" disabled={loading}>
          {loading ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}


