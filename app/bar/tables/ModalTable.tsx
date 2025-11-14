"use client";

import { useState, useEffect } from "react";

interface ModalTableProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item?: any;
}

export default function ModalTable({ isOpen, onClose, onSuccess, item }: ModalTableProps) {
  const [form, setForm] = useState({ nom: "", capacite: "0" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({ nom: item.nom ?? "", capacite: String(item.capacite ?? 0) });
    } else {
      setForm({ nom: "", capacite: "0" });
    }
  }, [item, isOpen]);

  if (!isOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const url = item ? `/api/bar/tables/${item.id}` : "/api/bar/tables";
    const method = item ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: form.nom, capacite: Number(form.capacite) }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ? JSON.stringify(data.error) : "Erreur");
      return;
    }
    setForm({ nom: "", capacite: "0" });
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
          <h2 className="text-xl font-bold text-gray-900">{item ? "Modifier la table/zone" : "Nouvelle table/zone"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-light">&times;</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm mb-2 font-semibold text-gray-900">Nom</label>
            <input
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              placeholder="Ex: Bar, Terrasse, VIP, Table 1, etc."
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-2 font-semibold text-gray-900">Capacité (nombre de places)</label>
            <input
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
              type="number"
              value={form.capacite}
              onChange={(e) => setForm({ ...form, capacite: e.target.value })}
              required
            />
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
              className="px-5 py-2.2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors"
              disabled={loading}
            >
              {loading ? "Enregistrement..." : item ? "Modifier" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

