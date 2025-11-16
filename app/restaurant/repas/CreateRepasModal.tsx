"use client";

import React, { useEffect, useState } from "react";

type Repas = { id?: number; nom: string; prix?: number; disponible?: boolean; categorie_id?: number | null };

export default function CreateRepasModal({ open, onCloseAction, onSavedAction, initial }: { open: boolean; onCloseAction?: () => void; onSavedAction?: (r?: any) => void; initial?: Repas | null }) {
  const [form, setForm] = useState<Repas>(initial ?? { nom: "", prix: 0, disponible: true, categorie_id: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<{ nom: boolean; prix: boolean }>({ nom: false, prix: false });

  useEffect(() => {
    setForm(initial ?? { nom: "", prix: 0, disponible: true, categorie_id: null });
    setTouched({ nom: false, prix: false });
    setError(null);
  }, [initial, open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTouched({ nom: true, prix: true });
    
    if (!form.nom || form.nom.trim() === "") {
      setError("Le nom du plat est requis");
      return;
    }
    if (!form.prix || Number(form.prix) <= 0) {
      setError("Le prix doit être supérieur à 0");
      return;
    }

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

  const nomError = touched.nom && (!form.nom || form.nom.trim() === "");
  const prixError = touched.prix && (!form.prix || Number(form.prix) <= 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onCloseAction?.()} />
      <div className="relative z-10 w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* En-tête */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">{initial?.id ? 'Éditer le plat' : 'Nouveau plat'}</h3>
            <button 
              onClick={() => onCloseAction?.()} 
              className="p-2 rounded-lg text-gray-500 hover:bg-white hover:text-gray-700 transition-colors"
              aria-label="Fermer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Formulaire */}
        <form onSubmit={submit} className="p-6 space-y-5">
          {/* Champ Nom */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Nom <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input 
                type="text"
                value={form.nom} 
                onChange={(e) => {
                  setForm({ ...form, nom: e.target.value });
                  if (touched.nom) setTouched({ ...touched, nom: true });
                }}
                onBlur={() => setTouched({ ...touched, nom: true })}
                className={`w-full px-4 py-3 border-2 rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                  nomError ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
                placeholder="Entrez le nom du plat"
                required
              />
              {nomError && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="group relative">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <div className="absolute right-0 top-full mt-2 w-48 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                      Veuillez renseigner ce champ.
                      <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {nomError && (
              <p className="mt-1.5 text-xs text-red-600 font-medium">Veuillez renseigner ce champ.</p>
            )}
          </div>

          {/* Champ Prix unitaire */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Prix unitaire <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-500 font-medium">FC</span>
              </div>
              <input 
                type="number" 
                step="0.01" 
                min="0"
                value={form.prix ?? 0} 
                onChange={(e) => {
                  setForm({ ...form, prix: Number(e.target.value) });
                  if (touched.prix) setTouched({ ...touched, prix: true });
                }}
                onBlur={() => setTouched({ ...touched, prix: true })}
                className={`w-full pl-12 pr-4 py-3 border-2 rounded-lg text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                  prixError ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
                placeholder="0"
                required
              />
            </div>
            {prixError && (
              <p className="mt-1.5 text-xs text-red-600 font-medium">Le prix doit être supérieur à 0.</p>
            )}
          </div>

          {/* Checkbox Disponible */}
          <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                id="disp" 
                type="checkbox" 
                checked={!!form.disponible} 
                onChange={(e) => setForm({ ...form, disponible: e.target.checked })} 
                className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
              />
              <span className="text-sm font-semibold text-gray-900">Disponible</span>
            </label>
          </div>

          {/* Champ Coût de production (optionnel) */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Coût de production <span className="text-xs font-normal text-gray-500">(optionnel)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-gray-500 font-medium">FC</span>
              </div>
              <input 
                type="number" 
                step="0.01" 
                min="0"
                value={(form as any).cout_production ?? ''} 
                onChange={(e) => setForm({ ...(form as any), cout_production: e.target.value ? Number(e.target.value) : undefined })} 
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                placeholder="0"
              />
            </div>
            <p className="mt-1.5 text-xs text-gray-500 italic">Si le serveur supporte le champ, il sera enregistré.</p>
          </div>

          {/* Message d'erreur global */}
          {error && (
            <div className="p-3 bg-red-50 border-2 border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-red-700 font-medium">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {error}
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button 
              type="button" 
              onClick={() => onCloseAction?.()} 
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={loading || !form.nom || !form.prix || Number(form.prix) <= 0} 
              className={`px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-colors ${
                loading || !form.nom || !form.prix || Number(form.prix) <= 0
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Envoi...
                </span>
              ) : (
                initial?.id ? 'Enregistrer' : 'Créer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
