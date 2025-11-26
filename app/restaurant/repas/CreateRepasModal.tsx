"use client";

import React, { useEffect, useMemo, useState } from "react";
import { MENU_TEMPLATE_SECTIONS, type MenuTemplateItem } from "./menuTemplate";

type Repas = { id?: number; nom: string; prix?: number; disponible?: boolean; categorie_id?: number | null; cout_production?: number | null };
type Category = { id: number; nom: string };
type Props = {
  open: boolean;
  onCloseAction?: () => void;
  onSavedAction?: (r?: any) => void;
  initial?: Repas | null;
  categories?: Category[];
};

const TAUX_CHANGE = 2200;
const emptyForm: Repas = { nom: "", prix: 0, disponible: true, categorie_id: null, cout_production: null };

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const francsToUsd = (value?: number | null) => Number(((Number(value ?? 0) || 0) / TAUX_CHANGE).toFixed(2));
const usdToFrancs = (value?: number | null) => Number(((Number(value ?? 0) || 0) * TAUX_CHANGE).toFixed(2));

export default function CreateRepasModal({ open, onCloseAction, onSavedAction, initial, categories = [] }: Props) {
  const [form, setForm] = useState<Repas>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<{ nom: boolean; prix: boolean }>({ nom: false, prix: false });
  const [selectedSection, setSelectedSection] = useState<string>(MENU_TEMPLATE_SECTIONS[0]?.key ?? "ENTREES");

  const categoryMap = useMemo(() => {
    const map = new Map<string, number>();
    categories.forEach((cat) => {
      map.set(normalize(cat.nom), cat.id);
    });
    return map;
  }, [categories]);

  const sectionCategoryId = useMemo(() => {
    const section = MENU_TEMPLATE_SECTIONS.find((s) => s.key === selectedSection);
    if (!section) return null;
    return categoryMap.get(normalize(section.defaultCategoryName)) ?? null;
  }, [selectedSection, categoryMap]);

  useEffect(() => {
    if (initial) {
      setForm({
        id: initial.id,
        nom: initial.nom,
        prix: francsToUsd(initial.prix),
        disponible: initial.disponible ?? true,
        categorie_id: initial.categorie_id ?? null,
        cout_production: (initial as any)?.cout_production ? francsToUsd((initial as any).cout_production) : null,
      });
      if (initial.categorie_id) {
        const category = categories.find((cat) => cat.id === initial.categorie_id);
        if (category) {
          const matchingSection = MENU_TEMPLATE_SECTIONS.find(
            (section) => normalize(section.defaultCategoryName) === normalize(category.nom),
          );
          if (matchingSection) setSelectedSection(matchingSection.key);
        }
      }
    } else {
      setForm({ ...emptyForm });
      setSelectedSection(MENU_TEMPLATE_SECTIONS[0]?.key ?? "ENTREES");
    }
    setTouched({ nom: false, prix: false });
    setError(null);
  }, [initial, open, categories]);

  const applyTemplate = (item: MenuTemplateItem) => {
    setForm((prev) => ({
      ...prev,
      nom: item.name,
      prix: item.price,
      categorie_id: sectionCategoryId ?? prev.categorie_id ?? null,
      disponible: prev.disponible ?? true,
    }));
    setTouched({ nom: true, prix: true });
  };

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

    const payload = { 
      nom: form.nom.trim(), 
      prix: usdToFrancs(form.prix), 
      disponible: Boolean(form.disponible),
      categorie_id: form.categorie_id ?? null,
    };

    if (typeof (form as any).cout_production === "number" && !Number.isNaN((form as any).cout_production)) {
      (payload as any).cout_production = usdToFrancs((form as any).cout_production);
    }

    setLoading(true);
    try {
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
  const selectedTemplateSection =
    MENU_TEMPLATE_SECTIONS.find((section) => section.key === selectedSection) ?? MENU_TEMPLATE_SECTIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 py-6 sm:px-6 sm:py-10">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => onCloseAction?.()} />
      <div className="relative z-10 w-full max-w-4xl bg-white rounded-[30px] shadow-2xl border border-slate-100 flex flex-col max-h-[95vh]">
        {/* En-tête */}
        <div className="px-6 sm:px-10 py-5 border-b border-slate-200 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/70 font-semibold mb-1">{initial?.id ? "Mise à jour" : "Création"}</p>
              <h3 className="text-2xl sm:text-3xl font-bold">{initial?.id ? "Modifier un plat" : "Nouveau plat"}</h3>
              <p className="text-sm text-white/80 mt-1">
                Renseignez les informations du plat. Les montants sont saisis en dollars puis convertis automatiquement en Francs.
              </p>
            </div>
            <button
              onClick={() => onCloseAction?.()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Fermer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Formulaire */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={submit} className="p-5 sm:p-8 space-y-6">
          {/* Sélection rapide basée sur le menu papier */}
          {selectedTemplateSection && (
            <section className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 sm:p-5 space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-800">Pré-remplissage depuis le menu papier</p>
                  <p className="text-xs text-blue-600">
                    Choisissez une section puis cliquez sur un plat pour remplir automatiquement le formulaire (prix en dollars).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="menu-section" className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
                    Section
                  </label>
                  <select
                    id="menu-section"
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm font-semibold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {MENU_TEMPLATE_SECTIONS.map((section) => (
                      <option key={section.key} value={section.key}>
                        {section.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {selectedTemplateSection.description && (
                <p className="text-xs text-blue-700">{selectedTemplateSection.description}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
                {selectedTemplateSection.items.map((item) => (
                  <button
                    type="button"
                    key={item.name}
                    onClick={() => applyTemplate(item)}
                    className="group rounded-xl border-2 border-blue-100 bg-white px-4 py-3 text-left shadow-sm transition hover:border-blue-400 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-800">{item.name}</p>
                        {item.note && <p className="text-xs text-gray-500">{item.note}</p>}
                      </div>
                      <span className="text-sm font-bold text-blue-700">{item.price.toFixed(2)} $</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Informations principales */}
          <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="flex flex-col">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                onBlur={() => setTouched((prev) => ({ ...prev, nom: true }))}
                className={`w-full px-4 py-3 border-2 rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                  nomError ? "border-red-300 bg-red-50" : "border-gray-300 bg-white hover:border-gray-400"
                }`}
                placeholder="Entrez le nom du plat"
                required
              />
              {nomError && <p className="mt-1.5 text-xs text-red-600 font-medium">Veuillez renseigner ce champ.</p>}
            </div>

            <div className="flex flex-col">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Prix unitaire <span className="text-red-500">*</span>{" "}
                <span className="text-xs text-gray-500">(en dollars)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-medium">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.prix ?? 0}
                  onChange={(e) => setForm({ ...form, prix: Number(e.target.value) })}
                  onBlur={() => setTouched((prev) => ({ ...prev, prix: true }))}
                  className={`w-full pl-12 pr-4 py-3 border-2 rounded-lg text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                    prixError ? "border-red-300 bg-red-50" : "border-gray-300 bg-white hover:border-gray-400"
                  }`}
                  placeholder="0"
                  required
                />
              </div>
              {prixError && <p className="mt-1.5 text-xs text-red-600 font-medium">Le prix doit être supérieur à 0.</p>}
            </div>
          </section>

          {/* Catégorie + disponibilité */}
          <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="flex flex-col">
              <label className="block text-sm font-bold text-gray-900 mb-2">Catégorie</label>
              <select
                value={form.categorie_id ?? ""}
                onChange={(e) => setForm({ ...form, categorie_id: e.target.value ? Number(e.target.value) : null })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                <option value="">Aucune (personnalisé)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nom}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-gray-500">
                Pré-remplie automatiquement lorsque vous choisissez un plat du menu.
              </p>
            </div>

            <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  id="disp"
                  type="checkbox"
                  checked={!!form.disponible}
                  onChange={(e) => setForm({ ...form, disponible: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
                />
                <div>
                  <span className="text-sm font-semibold text-gray-900 block">Disponible</span>
                  <span className="text-xs text-gray-500">
                    Décochez pour masquer temporairement le plat dans les commandes.
                  </span>
                </div>
              </label>
            </div>
          </section>

          {/* Coût de production */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Coût de production <span className="text-xs font-normal text-gray-500">(optionnel)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-medium">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={(form as any).cout_production ?? ""}
                  onChange={(e) =>
                    setForm({ ...(form as any), cout_production: e.target.value ? Number(e.target.value) : undefined })
                  }
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-900 bg-white hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="0"
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-500 italic">
                Saisi en dollars. Le serveur convertit automatiquement en Francs (taux 1 $ = 2200 FC).
              </p>
            </div>
          </section>

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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => onCloseAction?.()}
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !form.nom || !form.prix || Number(form.prix) <= 0}
              className={`w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors ${
                loading || !form.nom || !form.prix || Number(form.prix) <= 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 shadow-lg shadow-indigo-200"
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Envoi...
                </span>
              ) : initial?.id ? (
                "Enregistrer"
              ) : (
                "Créer"
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
