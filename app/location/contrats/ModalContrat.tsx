"use client";

import { useState, useEffect } from "react";

interface ModalContratProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingItem: any | null;
}

export default function ModalContrat({ isOpen, onClose, onSuccess, editingItem }: ModalContratProps) {
  const [biens, setBiens] = useState<any[]>([]);
  const [locataires, setLocataires] = useState<any[]>([]);
  const [form, setForm] = useState({
    bien_id: "",
    locataire_id: "",
    date_debut: "",
    date_fin: "",
    depot_garantie: "",
    avance: "",
    statut: "EN_ATTENTE"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Charger les biens et locataires
      Promise.all([
        fetch("/api/location/biens").then(r => r.json()),
        fetch("/api/location/locataires").then(r => r.json())
      ]).then(([biensData, locatairesData]) => {
        setBiens(biensData);
        setLocataires(locatairesData);
      });

      if (editingItem) {
        // Fonction helper pour convertir une date en format YYYY-MM-DD
        const formatDate = (dateValue: any): string => {
          if (!dateValue) return "";
          if (typeof dateValue === 'string') {
            // Si c'est déjà au format YYYY-MM-DD, le retourner tel quel
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
              return dateValue;
            }
            // Sinon, essayer de parser
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
              return date.toISOString().split('T')[0];
            }
            return "";
          }
          // Si c'est un objet Date
          if (dateValue instanceof Date) {
            if (!isNaN(dateValue.getTime())) {
              return dateValue.toISOString().split('T')[0];
            }
            return "";
          }
          return "";
        };

        // Si c'est un renouvellement (pas d'ID mais avec bien_id et locataire_id)
        // ou une modification (avec ID)
        setForm({
          bien_id: editingItem.bien_id ? String(editingItem.bien_id) : "",
          locataire_id: editingItem.locataire_id ? String(editingItem.locataire_id) : "",
          date_debut: formatDate(editingItem.date_debut),
          date_fin: formatDate(editingItem.date_fin),
          depot_garantie: editingItem.depot_garantie ? String(editingItem.depot_garantie) : "",
          avance: editingItem.avance ? String(editingItem.avance) : "",
          statut: editingItem.statut || "EN_ATTENTE"
        });
      } else {
        setForm({
          bien_id: "",
          locataire_id: "",
          date_debut: "",
          date_fin: "",
          depot_garantie: "",
          avance: "",
          statut: "EN_ATTENTE"
        });
      }
      setError(null);
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = editingItem?.id ? `/api/location/contrats/${editingItem.id}` : "/api/location/contrats";
      const method = editingItem?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bien_id: Number(form.bien_id),
          locataire_id: Number(form.locataire_id),
          date_debut: form.date_debut,
          date_fin: form.date_fin,
          depot_garantie: form.depot_garantie ? Number(form.depot_garantie) : null,
          avance: form.avance ? Number(form.avance) : null,
          statut: form.statut
        }),
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {editingItem?.id ? "Modifier le contrat" : "Nouveau contrat"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-light">&times;</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 font-semibold text-gray-900">Bien *</label>
              <select
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                value={form.bien_id}
                onChange={(e) => setForm({ ...form, bien_id: e.target.value })}
                required
              >
                <option value="">Sélectionner un bien</option>
                {biens.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.adresse} ({b.type}) - {b.etat === "LIBRE" ? "Libre" : b.etat === "OCCUPE" ? "Occupé" : "Maintenance"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2 font-semibold text-gray-900">Locataire *</label>
              <select
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                value={form.locataire_id}
                onChange={(e) => setForm({ ...form, locataire_id: e.target.value })}
                required
              >
                <option value="">Sélectionner un locataire</option>
                {locataires.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 font-semibold text-gray-900">Date de début *</label>
              <input
                type="date"
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                value={form.date_debut}
                onChange={(e) => setForm({ ...form, date_debut: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-2 font-semibold text-gray-900">Date de fin *</label>
              <input
                type="date"
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                value={form.date_fin}
                onChange={(e) => setForm({ ...form, date_fin: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 font-semibold text-gray-900">Dépôt de garantie (FC)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                value={form.depot_garantie}
                onChange={(e) => setForm({ ...form, depot_garantie: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm mb-2 font-semibold text-gray-900">Avance (FC)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                value={form.avance}
                onChange={(e) => setForm({ ...form, avance: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-2 font-semibold text-gray-900">Statut</label>
            <select
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
              value={form.statut}
              onChange={(e) => setForm({ ...form, statut: e.target.value })}
            >
              <option value="EN_ATTENTE">En attente</option>
              <option value="ACTIF">Actif</option>
              <option value="TERMINE">Terminé</option>
            </select>
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
              {loading ? "Enregistrement..." : editingItem?.id ? "Modifier" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

