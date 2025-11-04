"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

type CommandeDetails = {
  id: number;
  table_numero: string;
  statut: string;
  total: number;
  date_commande: string;
  details: Array<{
    id: number;
    repas_id: number;
    quantite: number;
    prix_total: number;
    repas: {
      nom: string;
      prix: number;
    };
  }>;
};

export default function CommandePage() {
  const router = useRouter();
  const params = useParams();
  const commandeId = params?.id;
  const [commande, setCommande] = useState<CommandeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      console.log("Params reçus:", params);
      console.log("ID de commande:", commandeId);
      if (commandeId && typeof commandeId === 'string') {
        await loadCommande();
      } else {
        console.error("ID de commande invalide ou manquant:", commandeId);
        setError("ID de commande invalide");
        setLoading(false);
      }
    };
    
    loadData();
  }, [commandeId]);

  async function loadCommande() {
    try {
      console.log("Tentative de chargement de la commande:", commandeId);
      const res = await fetch(`/api/restaurant/commandes/${commandeId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      console.log("Statut de la réponse:", res.status);
      const data = await res.json();
      console.log("Données reçues:", data);
      
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors du chargement");
      }
      setCommande(data);
    } catch (err: any) {
      console.error("Erreur lors du chargement:", err);
      setError(err.message || "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatut(statut: string) {
    if (!confirm(`Changer le statut de la commande à "${statut}" ?`)) return;
    setUpdating(true);
    try {
      console.log("Mise à jour du statut:", { commandeId, statut });
      const res = await fetch(`/api/restaurant/commandes/${commandeId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ statut }),
      });

      console.log("Réponse du serveur:", res.status);
      const data = await res.json();
      console.log("Données reçues:", data);

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      setCommande(data);
      setError(null);
    } catch (err: any) {
      console.error("Erreur lors de la mise à jour:", err);
      setError(err.message || "Erreur lors de la mise à jour");
    } finally {
      setUpdating(false);
    }
  }

  async function cancelCommande() {
    if (!confirm("Êtes-vous sûr de vouloir annuler cette commande ?")) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/restaurant/commandes/${params.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'annulation");
      }
      router.push("/restaurant/commandes");
    } catch (err: any) {
      setError(err.message || "Erreur");
      setUpdating(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!commande) return <div className="p-8 text-center text-gray-500">Commande non trouvée</div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-4 mb-1">
            <button onClick={() => router.push("/restaurant/commandes")} className="p-1 hover:bg-gray-100 rounded">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Commande #{commande.id}</h1>
          </div>
          <div className="text-sm text-gray-500">Créée le {new Date(commande.date_commande).toLocaleString()}</div>
        </div>
        
        <div className="flex items-center gap-3">
          <a
            href={`/api/exports/commande/${commande.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Imprimer ticket
          </a>
          {commande.statut === "EN_ATTENTE" && (
            <button
              onClick={() => cancelCommande()}
              disabled={updating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-red-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              Annuler commande
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Détails de la commande */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations principales */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-medium text-gray-900">Informations principales</h2>
            </div>
            <div className="p-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <dt className="text-sm text-gray-500">Table</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900">Table {commande.table_numero}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Statut</dt>
                  <dd className="mt-1">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm
                      ${commande.statut === 'EN_ATTENTE' ? 'bg-yellow-50 text-yellow-700' :
                      commande.statut === 'EN_PREPARATION' ? 'bg-blue-50 text-blue-700' :
                      commande.statut === 'SERVI' ? 'bg-green-50 text-green-700' :
                      commande.statut === 'PAYE' ? 'bg-gray-50 text-gray-700' :
                      'bg-gray-50 text-gray-700'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {commande.statut === 'EN_ATTENTE' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        ) : commande.statut === 'EN_PREPARATION' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 8l-7 7-7-7"/>
                        ) : commande.statut === 'SERVI' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4"/>
                        )}
                      </svg>
                      {commande.statut?.replace("_", " ")}
                    </div>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Liste des plats */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-medium text-gray-900">Détails de la commande</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {commande.details.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.repas.nom}</div>
                    <div className="text-sm text-gray-500">{Number(item.repas.prix).toFixed(2)} FC × {item.quantite}</div>
                  </div>
                  <div className="font-medium text-gray-900">{Number(item.prix_total).toFixed(2)} FC</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions et totaux */}
        <div>
          {/* Changer le statut */}
          <div className="bg-white rounded-xl border overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-medium text-gray-900">Gestion de la commande</h2>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {commande.statut === "EN_ATTENTE" && (
                  <button
                    onClick={() => updateStatut("EN_PREPARATION")}
                    disabled={updating}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    Commencer la préparation
                  </button>
                )}
                {commande.statut === "EN_PREPARATION" && (
                  <button
                    onClick={() => updateStatut("SERVI")}
                    disabled={updating}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                  >
                    Marquer comme servi
                  </button>
                )}
                {commande.statut === "SERVI" && (
                  <button
                    onClick={() => updateStatut("PAYE")}
                    disabled={updating}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                  >
                    Marquer comme payé
                  </button>
                )}
              </div>

              {error && (
                <div className="mt-3 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Total */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-medium text-gray-900">Résumé financier</h2>
            </div>
            <div className="p-4">
              <dl className="space-y-4">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-500">Sous-total</dt>
                  <dd className="text-sm font-medium text-gray-900">{Number(commande.total).toFixed(2)} FC</dd>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <dt className="text-base font-medium text-gray-900">Total</dt>
                  <dd className="text-xl font-semibold text-gray-900">{Number(commande.total).toFixed(2)} FC</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}