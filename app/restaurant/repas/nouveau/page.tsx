"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Swal from "sweetalert2";

export default function NouveauRepasPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nom: "", prix: "", disponible: true });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/restaurant/repas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: form.nom, prix: Number(form.prix), disponible: form.disponible }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ? JSON.stringify(data.error) : "Erreur");
      return;
    }
    router.push("/restaurant/repas");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Nouveau plat</h1>
      <form onSubmit={submit} className="max-w-md space-y-4 bg-white border rounded p-4">
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
        <button className="px-3 py-2 bg-blue-600 text-white rounded" disabled={loading}>
          {loading ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}


