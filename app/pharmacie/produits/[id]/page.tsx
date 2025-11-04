"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditProduitPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const id = Number(params.id);
  const [form, setForm] = useState({ nom: "", prix_unitaire: "", quantite_stock: "0", date_expiration: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/pharmacie/medicaments`);
      const data = await res.json();
      const p = data.find((x: any) => x.id === id);
      if (p) {
        setForm({
          nom: p.nom ?? "",
          prix_unitaire: String(p.prix_unitaire ?? ""),
          quantite_stock: String(p.quantite_stock ?? "0"),
          date_expiration: p.date_expiration ? new Date(p.date_expiration).toISOString().slice(0, 10) : "",
        });
      }
      setLoading(false);
    })();
  }, [id]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/pharmacie/medicaments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom: form.nom,
        prix_unitaire: Number(form.prix_unitaire),
        quantite_stock: Number(form.quantite_stock),
        date_expiration: form.date_expiration || null,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ? JSON.stringify(data.error) : "Erreur");
      return;
    }
    router.push("/pharmacie/produits");
  };

  const supprimer = async () => {
    if (!confirm("Supprimer ce produit ?")) return;
    const res = await fetch(`/api/pharmacie/medicaments/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/pharmacie/produits");
  };

  if (loading) return <div className="text-sm text-gray-500">Chargement...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Éditer produit</h1>
      <form onSubmit={save} className="max-w-md space-y-4 bg-white border rounded p-4">
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
        <div className="flex gap-2">
          <button className="px-3 py-2 bg-blue-600 text-white rounded">Enregistrer</button>
          <button type="button" onClick={supprimer} className="px-3 py-2 bg-gray-200 text-gray-800 rounded">Supprimer</button>
        </div>
      </form>
    </div>
  );
}


