"use client";

import { useState, useEffect } from "react";

interface ModalAjouterBoissonProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalAjouterBoisson({ isOpen, onClose, onSuccess }: ModalAjouterBoissonProps) {
  const [form, setForm] = useState({ nom: "", categorie_id: "", prix_achat: "", prix_vente: "", stock: "0", unite_mesure: "unités" });
  const [categories, setCategories] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      (async () => {
        const res = await fetch("/api/bar/categories");
        const data = await res.json();
        setCategories(data);
      })();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/bar/boissons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom: form.nom,
        categorie_id: form.categorie_id ? Number(form.categorie_id) : null,
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
    setForm({ nom: "", categorie_id: "", prix_achat: "", prix_vente: "", stock: "0", unite_mesure: "unités" });
    onSuccess();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity"
      onClick={onClose}
      aria-hidden={!isOpen}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Ajouter une boisson</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-light">&times;</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm mb-2 font-semibold text-gray-900">Nom</label>
            <input
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-2 font-semibold text-gray-900">Catégorie</label>
            <select
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
              value={form.categorie_id}
              onChange={(e) => setForm({ ...form, categorie_id: e.target.value })}
            >
              <option value="">Aucune catégorie</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 font-semibold text-gray-900">Prix d'achat (FC)</label>
              <input
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                type="number"
                step="0.01"
                value={form.prix_achat}
                onChange={(e) => setForm({ ...form, prix_achat: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-2 font-semibold text-gray-900">Prix de vente (FC)</label>
              <input
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                type="number"
                step="0.01"
                value={form.prix_vente}
                onChange={(e) => setForm({ ...form, prix_vente: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 font-semibold text-gray-900">Stock initial</label>
              <input
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-2 font-semibold text-gray-900">Unité de mesure</label>
              <input
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                value={form.unite_mesure}
                onChange={(e) => setForm({ ...form, unite_mesure: e.target.value })}
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors"
              disabled={loading}
            >
              {loading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

