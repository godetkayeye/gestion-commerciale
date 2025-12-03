"use client";

import { useState, useEffect } from "react";
import { useTauxChange } from "@/lib/hooks/useTauxChange";

interface ModalAjouterBoissonProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode?: "create" | "edit";
  boisson?: any | null;
}

const defaultForm = { 
  nom: "", 
  categorie_id: "", 
  prix_achat: "", 
  prix_vente: "", 
  prix_verre: "", 
  stock: "0", 
  unite_mesure: "unités",
  vente_en_bouteille: true,
  vente_en_verre: false
};

export default function ModalAjouterBoisson({ isOpen, onClose, onSuccess, mode = "create", boisson = null }: ModalAjouterBoissonProps) {
  const { tauxChange: TAUX_CHANGE } = useTauxChange();
  const [form, setForm] = useState(defaultForm);
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

      if (mode === "edit" && boisson) {
        // Convertir les prix de FC à $ pour l'affichage
        const prixAchatUSD = boisson.prix_achat 
          ? (Number(boisson.prix_achat) / TAUX_CHANGE).toFixed(2)
          : "";
        const prixVenteUSD = boisson.prix_vente
          ? (Number(boisson.prix_vente) / TAUX_CHANGE).toFixed(2)
          : "";
        const prixVerreUSD = boisson.prix_verre
          ? (Number(boisson.prix_verre) / TAUX_CHANGE).toFixed(2)
          : "";
        
        setForm({
          nom: boisson.nom ?? "",
          categorie_id: boisson.categorie_id ? String(boisson.categorie_id) : "",
          prix_achat: prixAchatUSD,
          prix_vente: prixVenteUSD,
          prix_verre: prixVerreUSD,
          stock: boisson.stock ? String(boisson.stock) : "0",
          unite_mesure: boisson.unite_mesure ?? "unités",
          vente_en_bouteille: boisson.vente_en_bouteille ?? true,
          vente_en_verre: boisson.vente_en_verre ?? false,
        });
      } else {
        setForm(defaultForm);
      }
    }
  }, [isOpen, mode, boisson]);

  if (!isOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Convertir les prix de $ à FC avant l'envoi
    const prixAchatFC = form.prix_achat ? Number(form.prix_achat) * TAUX_CHANGE : 0;
    const prixVenteFC = form.prix_vente ? Number(form.prix_vente) * TAUX_CHANGE : 0;
    const prixVerreFC = form.prix_verre ? Number(form.prix_verre) * TAUX_CHANGE : null;

    const payload = {
      nom: form.nom,
      categorie_id: form.categorie_id ? Number(form.categorie_id) : null,
      prix_achat: prixAchatFC,
      prix_vente: prixVenteFC,
      prix_verre: prixVerreFC,
      stock: Number(form.stock),
      unite_mesure: form.unite_mesure,
      vente_en_bouteille: form.vente_en_bouteille,
      vente_en_verre: form.vente_en_verre,
    };

    const url = mode === "edit" && boisson ? `/api/bar/boissons/${boisson.id}` : "/api/bar/boissons";
    const method = mode === "edit" ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ? JSON.stringify(data.error) : "Erreur");
      return;
    }

    setForm(defaultForm);
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
          <h2 className="text-xl font-bold text-gray-900">
            {mode === "edit" ? "Modifier la boisson" : "Ajouter une boisson"}
          </h2>
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
              <label className="block text-sm mb-2 font-semibold text-gray-900">Prix d'achat ($)</label>
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
              <label className="block text-sm mb-2 font-semibold text-gray-900">Prix de vente bouteille ($)</label>
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
          
          {/* Options de vente */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="vente_bouteille"
                checked={form.vente_en_bouteille}
                onChange={(e) => setForm({ ...form, vente_en_bouteille: e.target.checked })}
                className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="vente_bouteille" className="text-sm font-semibold text-gray-900 cursor-pointer">
                Vente en bouteille
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="vente_verre"
                checked={form.vente_en_verre}
                onChange={(e) => setForm({ ...form, vente_en_verre: e.target.checked })}
                className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="vente_verre" className="text-sm font-semibold text-gray-900 cursor-pointer">
                Vente en verre/mesure
              </label>
            </div>
            {form.vente_en_verre && (
              <div className="mt-3">
                <label className="block text-sm mb-2 font-semibold text-gray-900">Prix de vente verre/mesure ($)</label>
                <input
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                  type="number"
                  step="0.01"
                  value={form.prix_verre}
                  onChange={(e) => setForm({ ...form, prix_verre: e.target.value })}
                  placeholder="Ex: 5.00"
                />
                <p className="mt-1 text-xs text-gray-500">1 bouteille = 10 verres/mesures</p>
              </div>
            )}
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

