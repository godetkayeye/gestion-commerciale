"use client";

import { useState, useEffect } from "react";

interface ModalLocataireProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingItem: any | null;
}

export default function ModalLocataire({ isOpen, onClose, onSuccess, editingItem }: ModalLocataireProps) {
  const [form, setForm] = useState({ nom: "", contact: "", profession: "", piece_identite: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingItem) {
      setForm({
        nom: editingItem.nom || "",
        contact: editingItem.contact || "",
        profession: editingItem.profession || "",
        piece_identite: editingItem.piece_identite || "",
      });
    } else {
      setForm({ nom: "", contact: "", profession: "", piece_identite: "" });
    }
    setError(null);
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = editingItem ? `/api/location/locataires/${editingItem.id}` : "/api/location/locataires";
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
    <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {editingItem ? "Modifier le locataire" : "Nouveau locataire"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-light">&times;</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm mb-2 font-semibold text-gray-900">Nom complet *</label>
            <input
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              placeholder="Nom complet du locataire"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-2 font-semibold text-gray-900">Contact</label>
            <input
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
              type="tel"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              placeholder="Téléphone ou email"
            />
          </div>
          <div>
            <label className="block text-sm mb-2 font-semibold text-gray-900">Profession</label>
            <input
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
              value={form.profession}
              onChange={(e) => setForm({ ...form, profession: e.target.value })}
              placeholder="Profession du locataire"
            />
          </div>
          <div>
            <label className="block text-sm mb-2 font-semibold text-gray-900">Pièce d'identité</label>
            <input
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
              value={form.piece_identite}
              onChange={(e) => setForm({ ...form, piece_identite: e.target.value })}
              placeholder="Numéro de pièce d'identité"
            />
          </div>
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
              {loading ? "Enregistrement..." : editingItem ? "Modifier" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

