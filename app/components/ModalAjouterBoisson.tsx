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

    try {
      // Validation côté client
      if (!form.nom || form.nom.trim() === "") {
        setError("Le nom de la boisson est requis");
        setLoading(false);
        return;
      }

      if (!form.prix_achat || Number(form.prix_achat) <= 0) {
        setError("Le prix d'achat doit être supérieur à 0");
        setLoading(false);
        return;
      }

      if (!form.prix_vente || Number(form.prix_vente) <= 0) {
        setError("Le prix de vente bouteille doit être supérieur à 0");
        setLoading(false);
        return;
      }

      if (form.vente_en_verre && (!form.prix_verre || Number(form.prix_verre) <= 0)) {
        setError("Le prix de vente verre/mesure est requis si la vente en verre est activée");
        setLoading(false);
        return;
      }

      // Convertir les prix de $ à FC avant l'envoi
      const prixAchatFC = Number(form.prix_achat) * TAUX_CHANGE;
      const prixVenteFC = Number(form.prix_vente) * TAUX_CHANGE;
      const prixVerreFC = form.vente_en_verre && form.prix_verre 
        ? Number(form.prix_verre) * TAUX_CHANGE 
        : null;

      const payload = {
        nom: form.nom.trim(),
        categorie_id: form.categorie_id ? Number(form.categorie_id) : null,
        prix_achat: prixAchatFC,
        prix_vente: prixVenteFC,
        prix_verre: prixVerreFC,
        stock: Number(form.stock) || 0,
        unite_mesure: form.unite_mesure || "unités",
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

      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        let errorMessage = "Erreur lors de l'enregistrement";
        
        if (contentType && contentType.includes("application/json")) {
          try {
            const data = await res.json();
            if (data?.error) {
              if (typeof data.error === "object") {
                // Si c'est un objet d'erreur Zod, extraire les messages
                const errorObj = data.error;
                const messages = Object.entries(errorObj)
                  .map(([key, value]: [string, any]) => {
                    if (Array.isArray(value)) {
                      return value.join(", ");
                    }
                    return `${key}: ${value}`;
                  })
                  .join(" | ");
                errorMessage = messages || errorMessage;
              } else {
                errorMessage = data.error;
              }
            }
          } catch (parseError) {
            console.error("Erreur de parsing:", parseError);
          }
        } else {
          const text = await res.text();
          errorMessage = text || errorMessage;
        }
        
        setError(errorMessage);
        setLoading(false);
        return;
      }

      setForm(defaultForm);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Une erreur est survenue lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity p-4"
      onClick={onClose}
      aria-hidden={!isOpen}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">
              {mode === "edit" ? "Modifier la boisson" : "Ajouter une boisson"}
            </h2>
            <button 
              onClick={onClose} 
              className="text-white/90 hover:text-white hover:bg-white/20 rounded-full p-1.5 transition-colors"
              aria-label="Fermer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={submit} className="p-6 space-y-6">
          {/* Nom et Catégorie */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nom de la boisson <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none text-gray-900 transition-all"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Ex: Whisky Johnnie Walker"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Catégorie</label>
              <select
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none text-gray-900 transition-all bg-white"
                value={form.categorie_id}
                onChange={(e) => setForm({ ...form, categorie_id: e.target.value })}
              >
                <option value="">Aucune catégorie</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Prix d'achat et Prix de vente bouteille */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Prix d'achat ($) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  className="w-full border-2 border-gray-300 rounded-lg pl-8 pr-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none text-gray-900 transition-all"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.prix_achat}
                  onChange={(e) => setForm({ ...form, prix_achat: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Prix de vente bouteille ($) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  className="w-full border-2 border-gray-300 rounded-lg pl-8 pr-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none text-gray-900 transition-all"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.prix_vente}
                  onChange={(e) => setForm({ ...form, prix_vente: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>
          
          {/* Options de vente */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-100">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Options de vente
            </h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-300 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={form.vente_en_bouteille}
                  onChange={(e) => setForm({ ...form, vente_en_bouteille: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">Vente en bouteille</div>
                  <div className="text-xs text-gray-500">Vente de la bouteille complète</div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-300 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={form.vente_en_verre}
                  onChange={(e) => setForm({ ...form, vente_en_verre: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">Vente en verre/mesure</div>
                  <div className="text-xs text-gray-500">Vente par verre ou mesure (1 bouteille = 10 verres)</div>
                </div>
              </label>
              {form.vente_en_verre && (
                <div className="mt-4 p-4 bg-white rounded-lg border-2 border-blue-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Prix de vente verre/mesure ($) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      className="w-full border-2 border-gray-300 rounded-lg pl-8 pr-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none text-gray-900 transition-all"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.prix_verre}
                      onChange={(e) => setForm({ ...form, prix_verre: e.target.value })}
                      placeholder="Ex: 5.00"
                      required={form.vente_en_verre}
                    />
                  </div>
                  <p className="mt-2 text-xs text-blue-600 font-medium flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    1 bouteille = 10 verres/mesures
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Stock et Unité de mesure */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Stock initial <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none text-gray-900 transition-all"
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Unité de mesure</label>
              <input
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none text-gray-900 transition-all"
                value={form.unite_mesure}
                onChange={(e) => setForm({ ...form, unite_mesure: e.target.value })}
                placeholder="Ex: bouteilles"
              />
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-800">Erreur</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  <span>Enregistrer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

