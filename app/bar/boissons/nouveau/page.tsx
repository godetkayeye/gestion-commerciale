"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NouvelleBoissonPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nom: "", prix_achat: "", prix_vente: "", stock: "0", unite_mesure: "unités" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/bar/boissons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom: form.nom,
        prix_achat: Number(form.prix_achat),
        prix_vente: Number(form.prix_vente),
        stock: Number(form.stock),
        unite_mesure: form.unite_mesure,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ? JSON.stringify(data.error) : "Erreur");
      return;
    }
    router.push("/bar/boissons");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Nouvelle boisson</h1>
      <form onSubmit={submit} className="max-w-md space-y-4 bg-white border rounded p-4">
        <div>
          <label className="block text-sm mb-1">Nom</label>
          <input className="w-full border rounded px-3 py-2" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Prix d'achat</label>
          <input className="w-full border rounded px-3 py-2" type="number" step="0.01" value={form.prix_achat} onChange={(e) => setForm({ ...form, prix_achat: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Prix de vente</label>
          <input className="w-full border rounded px-3 py-2" type="number" step="0.01" value={form.prix_vente} onChange={(e) => setForm({ ...form, prix_vente: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Stock initial</label>
          <input className="w-full border rounded px-3 py-2" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Unité de mesure</label>
          <input className="w-full border rounded px-3 py-2" value={form.unite_mesure} onChange={(e) => setForm({ ...form, unite_mesure: e.target.value })} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="px-3 py-2 bg-blue-600 text-white rounded" disabled={loading}>
          {loading ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}

