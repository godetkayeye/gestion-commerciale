"use client";

import React, { useEffect, useState } from "react";

type Repas = { id?: number; nom: string; prix?: number; disponible?: boolean; categorie_id?: number | null };

export default function CreateRepasModal({ open, onCloseAction, onSavedAction, initial }: { open: boolean; onCloseAction?: () => void; onSavedAction?: (r?: any) => void; initial?: Repas | null }) {
  const [form, setForm] = useState<Repas>(initial ?? { nom: "", prix: 0, disponible: true, categorie_id: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(initial ?? { nom: "", prix: 0, disponible: true, categorie_id: null });
  }, [initial]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = { nom: form.nom, prix: Number(form.prix), disponible: Boolean(form.disponible), categorie_id: form.categorie_id ?? null };
      let res;
      if (initial?.id) {
        res = await fetch(`/api/restaurant/repas/${initial.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      } else {
        res = await fetch(`/api/restaurant/repas`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur");
      onSavedAction?.(data);
      onCloseAction?.();
    } catch (err: any) {
      setError(err?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => onCloseAction?.()} />
      <div className="relative z-10 w-full max-w-lg mx-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{initial?.id ? 'Éditer le plat' : 'Nouveau plat'}</h3>
            <button onClick={() => onCloseAction?.()} className="p-2 rounded-md text-gray-500 hover:bg-gray-100">✕</button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Nom</label>
              <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className="w-full px-3 py-2 border rounded" required />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Prix unitaire</label>
              <input type="number" step="0.01" value={form.prix ?? 0} onChange={(e) => setForm({ ...form, prix: Number(e.target.value) })} className="w-full px-3 py-2 border rounded" required />
            </div>
            <div className="flex items-center gap-2">
              <input id="disp" type="checkbox" checked={!!form.disponible} onChange={(e) => setForm({ ...form, disponible: e.target.checked })} />
              <label htmlFor="disp" className="text-sm">Disponible</label>
            </div>

            {/* Optional: coût de production field — will be sent but stored only if backend supports it */}
            <div>
              <label className="block text-sm text-gray-700 mb-1">Coût de production (optionnel)</label>
              <input type="number" step="0.01" value={(form as any).cout_production ?? ''} onChange={(e) => setForm({ ...(form as any), cout_production: e.target.value ? Number(e.target.value) : undefined })} className="w-full px-3 py-2 border rounded" />
              <p className="text-xs text-gray-400 mt-1">Si le serveur supporte le champ, il sera enregistré.</p>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => onCloseAction?.()} className="px-3 py-2 bg-gray-100 rounded">Annuler</button>
              <button type="submit" disabled={loading} className="px-3 py-2 bg-blue-600 text-white rounded">{loading ? 'Envoi...' : (initial?.id ? 'Enregistrer' : 'Créer')}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
