"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditRepasPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const id = Number(params.id);
  const [form, setForm] = useState({ nom: "", prix: "", disponible: true });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/restaurant/repas`);
      const data = await res.json();
      const p = data.find((x: any) => x.id === id);
      if (p) {
        setForm({ nom: p.nom ?? "", prix: String(p.prix ?? ""), disponible: Boolean(p.disponible) });
      }
      setLoading(false);
    })();
  }, [id]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/restaurant/repas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: form.nom, prix: Number(form.prix), disponible: form.disponible }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ? JSON.stringify(data.error) : "Erreur");
      return;
    }
    router.push("/restaurant/repas");
  };

  const supprimer = async () => {
    if (!confirm("Supprimer ce plat ?")) return;
    const res = await fetch(`/api/restaurant/repas/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/restaurant/repas");
  };

  if (loading) return <div className="text-sm text-gray-500">Chargement...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Éditer plat</h1>
      <form onSubmit={save} className="max-w-md space-y-4 bg-white border rounded p-4">
        <div>
          <label className="block text-sm mb-1">Nom</label>
          <input className="w-full border rounded px-3 py-2" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Prix</label>
          <input className="w-full border rounded px-3 py-2" type="number" step="0.01" value={form.prix} onChange={(e) => setForm({ ...form, prix: e.target.value })} required />
        </div>
        <div className="flex items-center gap-2">
          <input id="disp" type="checkbox" checked={form.disponible} onChange={(e) => setForm({ ...form, disponible: e.target.checked })} />
          <label htmlFor="disp" className="text-sm">Disponible</label>
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


