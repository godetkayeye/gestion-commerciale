"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import CreateCommandeModal from "./CreateCommandeModal";

type Commande = { id: number; table_numero?: string | null; statut?: string | null; total?: number | null; date_commande?: Date | string | null };

interface CommandesClientProps {
  initial: Commande[];
  commandesAujourdhui: number;
  pourcentageChangement: string;
  commandesEnAttente: number;
  commandesEnPreparation: number;
  totalVentes: number;
}

export default function CommandesClient({ 
  initial, 
  commandesAujourdhui, 
  pourcentageChangement, 
  commandesEnAttente, 
  commandesEnPreparation, 
  totalVentes 
}: CommandesClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [commandes, setCommandes] = useState<Commande[]>(initial || []);
  const [open, setOpen] = useState(false);
  const userRole = session?.user?.role?.toUpperCase() || "";
  const canCancel = userRole !== "CAISSE_RESTAURANT";

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
    <div className="space-y-6">
      {/* En-tête avec navigation et stats */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Commandes</h1>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">Gérez les commandes du restaurant en temps réel</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
              </svg>
              Filtrer
            </button>
            <button 
              onClick={() => setOpen(true)} 
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
              </svg>
              Nouvelle commande
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-xs sm:text-sm font-medium text-gray-500">Commandes aujourd'hui</div>
            <div className="mt-2 flex items-end gap-2">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">{commandesAujourdhui}</div>
              {parseFloat(pourcentageChangement) > 0 && (
                <div className="text-xs sm:text-sm text-green-600 mb-1 font-medium">+{pourcentageChangement}%</div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-xs sm:text-sm font-medium text-gray-500">En attente</div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">{commandesEnAttente}</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-xs sm:text-sm font-medium text-gray-500">En préparation</div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">{commandesEnPreparation}</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="text-xs sm:text-sm font-medium text-gray-500">Total des ventes</div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{totalVentes.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC</div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des commandes */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Version desktop : tableau */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">COMMANDE</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">TABLE</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">STATUT</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">TOTAL</th>
                <th className="py-3 px-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {commandes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="font-medium text-gray-900">#{c.id}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                      </svg>
                      Table {c.table_numero || "-"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative inline-flex items-center">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                        ${c.statut === 'EN_ATTENTE' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                        c.statut === 'EN_PREPARATION' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        c.statut === 'SERVI' ? 'bg-green-50 text-green-700 border border-green-200' :
                        c.statut === 'PAYE' ? 'bg-green-50 text-green-700 border border-green-200' :
                        'bg-gray-50 text-gray-700 border border-gray-200'}`}>
                        {c.statut === 'PAYE' ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        ) : c.statut === 'EN_ATTENTE' ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        ) : c.statut === 'EN_PREPARATION' ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                          </svg>
                        )}
                        <span className="hidden lg:inline">{c.statut === 'EN_ATTENTE' ? 'EN ATTENTE' : c.statut === 'EN_PREPARATION' ? 'EN PREPARATION' : c.statut === 'PAYE' ? 'PAYE' : c.statut === 'SERVI' ? 'SERVI' : c.statut || 'N/A'}</span>
                        <span className="lg:hidden">{c.statut === 'EN_ATTENTE' ? 'ATTENTE' : c.statut === 'EN_PREPARATION' ? 'PREPA' : c.statut === 'PAYE' ? 'PAYE' : c.statut === 'SERVI' ? 'SERVI' : c.statut || 'N/A'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900 whitespace-nowrap">
                      {Number(c.total || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      <Link
                        href={`/restaurant/commandes/${c.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                        </svg>
                        <span className="hidden lg:inline">Détails & Suivi</span>
                        <span className="lg:hidden">Détails</span>
                      </Link>

                      <button 
                        onClick={() => router.push(`/restaurant/commandes/${c.id}`)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors border
                          ${c.statut === 'EN_ATTENTE' ? 'bg-white text-orange-700 border-orange-200 hover:bg-orange-50' :
                          c.statut === 'EN_PREPARATION' ? 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50' :
                          c.statut === 'SERVI' ? 'bg-white text-green-700 border-green-200 hover:bg-green-50' :
                          c.statut === 'PAYE' ? 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50' :
                          'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                      >
                        <span className="hidden lg:inline">Changer statut</span>
                        <span className="lg:hidden">Statut</span>
                      </button>

                      <a
                        href={`/api/exports/commande/${c.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                        title="PDF"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <span className="hidden lg:inline">PDF</span>
                      </a>

                      {c.statut === 'EN_ATTENTE' && canCancel && (
                        <button
                          onClick={() => router.push(`/restaurant/commandes/${c.id}?action=cancel`)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                          <span className="hidden lg:inline">Annuler</span>
                        </button>
                      )}
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

        {/* Version mobile : cartes */}
        <div className="md:hidden divide-y divide-gray-200">
          {commandes.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"/>
                </svg>
              </div>
              <div className="text-sm text-gray-500 mb-4">Aucune commande pour le moment</div>
              <button 
                onClick={() => setOpen(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Créer une nouvelle commande
              </button>
            </div>
          ) : (
            commandes.map((c) => (
              <div key={c.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">Commande #{c.id}</div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                        </svg>
                        Table {c.table_numero || "-"}
                      </div>
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium
                        ${c.statut === 'EN_ATTENTE' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                        c.statut === 'EN_PREPARATION' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        c.statut === 'SERVI' ? 'bg-green-50 text-green-700 border border-green-200' :
                        c.statut === 'PAYE' ? 'bg-green-50 text-green-700 border border-green-200' :
                        'bg-gray-50 text-gray-700 border border-gray-200'}`}>
                        {c.statut === 'EN_ATTENTE' ? 'ATTENTE' : c.statut === 'EN_PREPARATION' ? 'PREPA' : c.statut === 'PAYE' ? 'PAYE' : c.statut === 'SERVI' ? 'SERVI' : c.statut || 'N/A'}
                      </div>
                    </div>
                    <div className="text-base font-bold text-gray-900">
                      {Number(c.total || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Link
                    href={`/restaurant/commandes/${c.id}`}
                    className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                    Détails
                  </Link>
                  <a
                    href={`/api/exports/commande/${c.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    PDF
                  </a>
                  {c.statut === 'EN_ATTENTE' && canCancel && (
                    <button
                      onClick={() => router.push(`/restaurant/commandes/${c.id}?action=cancel`)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                      Annuler
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <CreateCommandeModal open={open} onCloseAction={() => setOpen(false)} onCreatedAction={handleCreated} />
    </div>
  );
}
