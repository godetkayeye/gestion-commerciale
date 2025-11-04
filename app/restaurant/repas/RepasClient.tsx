"use client";

import React, { useState } from "react";
import Link from "next/link";
import CreateRepasModal from "./CreateRepasModal";

type Repas = { id: number; nom: string; prix: number; disponible: boolean };
type TopDish = { id: number | null; nom: string; quantite: number; total: number };

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
  };

  const toggleDisponibilite = async (id: number, current: boolean) => {
    try {
      const res = await fetch(`/api/restaurant/repas/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ disponible: !current, nom: items.find(i => i.id === id)?.nom || '', prix: items.find(i => i.id === id)?.prix || 0 }) });
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">Plats (Restaurant)</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => { setEditing(null); setOpen(true); }} className="px-3 py-2 bg-blue-600 text-white rounded text-sm">Nouveau plat</button>
          <Link href="/restaurant/repas" className="px-3 py-2 bg-gray-100 text-gray-800 rounded text-sm">Liste complète</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Liste des plats</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2 text-sm font-medium text-gray-800">Nom</th>
                    <th className="text-left p-2 text-sm font-medium text-gray-800">Prix</th>
                    <th className="text-left p-2 text-sm font-medium text-gray-800">Disponible</th>
                    <th className="text-left p-2 text-sm font-medium text-gray-800">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p, idx) => (
                    <tr key={p.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-t hover:bg-gray-100`}>
                      <td className="p-3 text-sm font-medium text-gray-900">{p.nom}</td>
                      <td className="p-3 text-sm text-blue-700 font-semibold">{Number(p.prix).toFixed(2)} FC</td>
                      <td className="p-3">
                        {p.disponible ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Disponible</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Indisponible</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <button onClick={() => { setEditing(p); setOpen(true); }} className="text-blue-600 hover:underline">Éditer</button>
                          <button
                            onClick={() => toggleDisponibilite(p.id, p.disponible)}
                            aria-label={p.disponible ? `Désactiver ${p.nom}` : `Activer ${p.nom}`}
                            className={p.disponible ?
                              "text-sm px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-200" :
                              "text-sm px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-200"}
                          >
                            {p.disponible ? 'Désactiver' : 'Activer'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Plats les plus commandés (cette semaine)</h3>
          <div className="space-y-2">
            {top.map((d, idx) => (
              <div key={`${d.id}-${idx}`} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium">{idx + 1}</div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{d.nom}</div>
                    <div className="text-xs text-gray-500">Quantité: {d.quantite}</div>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-900">{Number(d.total).toFixed(2)} FC</div>
              </div>
            ))}
            {top.length === 0 && <div className="text-sm text-gray-500">Aucune donnée disponible</div>}
          </div>
        </div>
      </div>

      <CreateRepasModal open={open} onCloseAction={() => setOpen(false)} onSavedAction={handleSaved} initial={editing ?? null} />
    </div>
  );
}
