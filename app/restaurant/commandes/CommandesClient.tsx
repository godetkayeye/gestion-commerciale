"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CreateCommandeModal from "./CreateCommandeModal";

type Commande = { id: number; table_numero?: string | null; statut?: string | null; total?: number | null };

export default function CommandesClient({ initial }: { initial: Commande[] }) {
  const router = useRouter();
  const [commandes, setCommandes] = useState<Commande[]>(initial || []);
  const [open, setOpen] = useState(false);

  const handleCreated = (data: any) => {
    // Si l'API retourne la commande créée
    if (data && data.id) {
      const total = typeof data.total === 'string' 
        ? parseFloat(data.total) 
        : typeof data.total === 'number' 
          ? data.total 
          : 0;

      const newCmd: Commande = {
        id: Number(data.id),
        table_numero: data.table_numero || "",
        statut: data.statut || "EN_ATTENTE",
        total: total
      };
      
      setCommandes((s) => [newCmd, ...s]);
    } else {
      // En cas d'erreur, on recharge la page
      window.location.reload();
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      {/* En-tête avec navigation et stats */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Commandes</h1>
            <p className="mt-1 text-sm text-gray-500">Gérez les commandes du restaurant en temps réel</p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/restaurant/commandes" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"/>
              </svg>
              Filtrer
            </Link>
            <button 
              onClick={() => setOpen(true)} 
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
              </svg>
              Nouvelle commande
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border p-4">
            <div className="text-sm font-medium text-gray-500">Commandes aujourd'hui</div>
            <div className="mt-2 flex items-end gap-2">
              <div className="text-2xl font-bold text-gray-900">{commandes.length}</div>
              <div className="text-sm text-green-600 mb-1">+12%</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="text-sm font-medium text-gray-500">En attente</div>
            <div className="mt-2 flex items-end gap-2">
              <div className="text-2xl font-bold text-gray-900">
                {commandes.filter(c => c.statut === 'EN_ATTENTE').length}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="text-sm font-medium text-gray-500">En préparation</div>
            <div className="mt-2 flex items-end gap-2">
              <div className="text-2xl font-bold text-gray-900">
                {commandes.filter(c => c.statut === 'EN_PREPARATION').length}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="text-sm font-medium text-gray-500">Total des ventes</div>
            <div className="mt-2 flex items-end gap-2">
              <div className="text-2xl font-bold text-gray-900">
                {commandes.reduce((acc, c) => acc + (c.total || 0), 0).toFixed(2)} FC
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des commandes */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commande</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {commandes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="font-medium text-gray-900">#{c.id}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm bg-blue-50 text-blue-700">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                      </svg>
                      Table {c.table_numero}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm
                      ${c.statut === 'EN_ATTENTE' ? 'bg-yellow-50 text-yellow-700' :
                      c.statut === 'EN_PREPARATION' ? 'bg-blue-50 text-blue-700' :
                      c.statut === 'SERVI' ? 'bg-green-50 text-green-700' :
                      c.statut === 'PAYE' ? 'bg-gray-50 text-gray-700' :
                      'bg-gray-50 text-gray-700'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {c.statut === 'EN_ATTENTE' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        ) : c.statut === 'EN_PREPARATION' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 8l-7 7-7-7"/>
                        ) : c.statut === 'SERVI' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4"/>
                        )}
                      </svg>
                      {c.statut?.replace('_', ' ')}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {`${(Number(c.total || 0)).toFixed(2)} FC`}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {/* Menu d'actions */}
                      <div className="relative inline-flex items-center gap-2">
                        <Link
                          href={`/restaurant/commandes/${c.id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                          </svg>
                          Détails & Suivi
                        </Link>

                        <div className="flex items-center gap-1">
                          {/* Bouton Modifier Statut - change de couleur selon le statut */}
                          <button 
                            onClick={() => router.push(`/restaurant/commandes/${c.id}`)}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                              ${c.statut === 'EN_ATTENTE' ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' :
                              c.statut === 'EN_PREPARATION' ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' :
                              c.statut === 'SERVI' ? 'bg-green-50 text-green-700 hover:bg-green-100' :
                              'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {c.statut === 'EN_ATTENTE' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              ) : c.statut === 'EN_PREPARATION' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 8l-7 7-7-7"/>
                              ) : c.statut === 'SERVI' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4"/>
                              )}
                            </svg>
                            Changer statut
                          </button>

                          <a
                            href={`/api/exports/commande/${c.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-sm font-medium transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                            PDF
                          </a>

                          {c.statut === 'EN_ATTENTE' && (
                            <button
                              onClick={() => router.push(`/restaurant/commandes/${c.id}?action=cancel`)}
                              className="inline-flex items-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                              </svg>
                              Annuler
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {commandes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <div className="max-w-sm mx-auto">
                      <div className="text-gray-400 mb-2">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"/>
                        </svg>
                      </div>
                      <div className="text-sm text-gray-500">Aucune commande pour le moment</div>
                      <button 
                        onClick={() => setOpen(true)}
                        className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Créer une nouvelle commande
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateCommandeModal open={open} onCloseAction={() => setOpen(false)} onCreatedAction={handleCreated} />
    </div>
  );
}
