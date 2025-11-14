"use client";

import { useState } from "react";

interface ModalAjouterBienProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalAjouterBien({ isOpen, onClose, onSuccess }: ModalAjouterBienProps) {
  const [form, setForm] = useState({
    type: "APPARTEMENT",
    adresse: "",
    superficie: "",
    prix_mensuel: "",
    description: "",
    etat: "LIBRE",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/location/biens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: form.type,
        adresse: form.adresse,
        superficie: Number(form.superficie),
        prix_mensuel: Number(form.prix_mensuel),
        description: form.description || null,
        etat: form.etat,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ? JSON.stringify(data.error) : "Erreur");
      return;
    }
    setForm({
      type: "APPARTEMENT",
      adresse: "",
      superficie: "",
      prix_mensuel: "",
      description: "",
      etat: "LIBRE",
    });
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Ajouter un bien</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-light">&times;</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 font-semibold text-gray-900">Type de bien</label>
              <select
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                required
              >
                <option value="APPARTEMENT">Appartement</option>
                <option value="BUREAU">Bureau</option>
                <option value="LOCAL_COMMERCIAL">Local commercial</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2 font-semibold text-gray-900">État</label>
              <select
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                value={form.etat}
                onChange={(e) => setForm({ ...form, etat: e.target.value })}
                required
              >
                <option value="LIBRE">Libre</option>
                <option value="OCCUPE">Occupé</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm mb-2 font-semibold text-gray-900">Adresse</label>
            <input
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
              value={form.adresse}
              onChange={(e) => setForm({ ...form, adresse: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 font-semibold text-gray-900">Superficie (m²)</label>
              <input
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                type="number"
                step="0.01"
                value={form.superficie}
                onChange={(e) => setForm({ ...form, superficie: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-2 font-semibold text-gray-900">Prix mensuel (FC)</label>
              <input
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                type="number"
                step="0.01"
                value={form.prix_mensuel}
                onChange={(e) => setForm({ ...form, prix_mensuel: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-2 font-semibold text-gray-900">Description</label>
            <textarea
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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

