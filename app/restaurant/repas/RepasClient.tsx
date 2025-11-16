"use client";

import React, { useState } from "react";
import Link from "next/link";
import CreateRepasModal from "./CreateRepasModal";

type Repas = { id: number; nom: string; prix: number; disponible: boolean };
type TopDish = { id: number; nom: string; quantite: number; total: number };

export default function RepasClient({ initial, top }: { initial: Repas[]; top: TopDish[] }) {
  const [items, setItems] = useState<Repas[]>(initial || []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Repas | null>(null);

  const handleSaved = (data: any) => {
    if (!data) return;
    const exists = items.find((i) => i.id === data.id);
    const newItem = { id: data.id, nom: data.nom, prix: Number(data.prix || 0), disponible: Boolean(data.disponible ?? true) };
    if (exists) setItems((s) => s.map((it) => (it.id === newItem.id ? newItem : it)));
    else setItems((s) => [newItem, ...s]);
    setOpen(false);
    setEditing(null);
  };

  const toggleDisponibilite = async (id: number, current: boolean) => {
    if (!confirm(`Êtes-vous sûr de vouloir ${current ? 'désactiver' : 'activer'} ce plat ?`)) return;
    try {
      const res = await fetch(`/api/restaurant/repas/${id}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          disponible: !current, 
          nom: items.find(i => i.id === id)?.nom || '', 
          prix: items.find(i => i.id === id)?.prix || 0 
        }) 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur');
      setItems((s) => s.map(it => it.id === id ? { ...it, disponible: !current } : it));
    } catch (err) {
      console.error(err);
      alert('Impossible de changer la disponibilité');
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec titre et boutons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Plats (Restaurant)</h1>
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => { setEditing(null); setOpen(true); }} 
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
            </svg>
            Nouveau plat
          </button>
          <Link 
            href="/restaurant/repas" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Liste complète
          </Link>
        </div>
      </div>

      {/* Layout en 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Panneau gauche - Liste des plats */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900">Liste des plats</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nom</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Prix</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Disponible</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                      Aucun plat disponible
                    </td>
                  </tr>
                ) : (
                  items.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{p.nom}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-blue-700">
                          {Number(p.prix).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {p.disponible ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Disponible
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Indisponible
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <button 
                            onClick={() => { setEditing(p); setOpen(true); }} 
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                          >
                            Éditer
                          </button>
                          {p.disponible && (
                            <button
                              onClick={() => toggleDisponibilite(p.id, p.disponible)}
                              aria-label={`Désactiver ${p.nom}`}
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
                            >
                              Désactiver
                            </button>
                          )}
                          {!p.disponible && (
                            <button
                              onClick={() => toggleDisponibilite(p.id, p.disponible)}
                              aria-label={`Activer ${p.nom}`}
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                            >
                              Activer
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panneau droit - Plats les plus commandés */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900">Plats les plus commandés (cette semaine)</h2>
          </div>
          <div className="p-4 sm:p-6">
            {top.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-sm text-gray-500">Aucune donnée disponible</div>
                <div className="text-xs text-gray-400 mt-1">Aucune commande cette semaine</div>
              </div>
            ) : (
              <div className="space-y-3">
                {top.map((d, idx) => (
                  <div key={`${d.id}-${idx}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{d.nom}</div>
                        <div className="text-xs text-gray-600 mt-0.5">Quantité: {d.quantite}</div>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 whitespace-nowrap ml-3">
                      {Number(d.total).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateRepasModal open={open} onCloseAction={() => { setOpen(false); setEditing(null); }} onSavedAction={handleSaved} initial={editing ?? null} />
    </div>
  );
}
