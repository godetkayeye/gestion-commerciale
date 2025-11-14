"use client";

import { useState, useEffect } from "react";

interface ModalPersonnelProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingItem: any | null;
}

export default function ModalPersonnel({ isOpen, onClose, onSuccess, editingItem }: ModalPersonnelProps) {
  const [form, setForm] = useState({ nom: "", role: "SERVEUR" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingItem) {
      setForm({
        nom: editingItem.nom || "",
        role: editingItem.role || "SERVEUR",
      });
    } else {
      setForm({ nom: "", role: "SERVEUR" });
    }
    setError(null);
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = editingItem ? `/api/bar/personnel/${editingItem.id}` : "/api/bar/personnel";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'enregistrement");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {editingItem ? "Modifier le personnel" : "Nouveau membre du personnel"}
          </h2>
        </div>
        <form onSubmit={submit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm mb-2 font-semibold text-gray-900">Nom</label>
            <input
              type="text"
              required
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900 placeholder-gray-500"
              placeholder="Nom complet"
            />
          </div>
          <div>
            <label className="block text-sm mb-2 font-semibold text-gray-900">Rôle</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
            >
              <option value="SERVEUR">Serveur</option>
              <option value="BARMAN">Barman</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? "Enregistrement..." : editingItem ? "Modifier" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

