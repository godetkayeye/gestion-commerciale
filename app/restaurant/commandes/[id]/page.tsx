"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

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
  const { data: session } = useSession();
  const commandeId = params?.id;
  const [commande, setCommande] = useState<CommandeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const userRole = session?.user?.role?.toUpperCase() || "";
  const canCancel = userRole !== "CAISSE_RESTAURANT";

  useEffect(() => {
    const loadData = async () => {
      if (commandeId && typeof commandeId === 'string') {
        await loadCommande();
      } else {
        setError("ID de commande invalide");
        setLoading(false);
      }
    };
    
    loadData();
  }, [commandeId]);

  async function loadCommande() {
    try {
      const res = await fetch(`/api/restaurant/commandes/${commandeId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        // Essayer de lire le message d'erreur
        let errorMessage = "Erreur lors du chargement";
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Si la réponse n'est pas du JSON, utiliser le statut
          errorMessage = `Erreur ${res.status}: ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Vérifier que la réponse a du contenu
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Réponse invalide du serveur");
      }

      const text = await res.text();
      if (!text || text.trim() === "") {
        throw new Error("Réponse vide du serveur");
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("Erreur de parsing JSON:", parseError, "Texte reçu:", text);
        throw new Error("Réponse JSON invalide du serveur");
      }

      if (!data || !data.id) {
        throw new Error("Données de commande invalides");
      }

      setCommande(data);
      setError(null);
    } catch (err: any) {
      console.error("Erreur lors du chargement:", err);
      setError(err.message || "Erreur lors du chargement de la commande");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatut(statut: string) {
    if (!confirm(`Changer le statut de la commande à "${statut}" ?`)) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/restaurant/commandes/${commandeId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ statut }),
      });

      const data = await res.json();

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
      const res = await fetch(`/api/restaurant/commandes/${commandeId}`, {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-500">Chargement...</div>
        </div>
      </div>
    );
  }

  if (error && !commande) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 font-medium mb-2">Erreur</div>
          <div className="text-red-500 text-sm">{error}</div>
          <Link
            href="/restaurant/commandes"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour aux commandes
          </Link>
        </div>
      </div>
    );
  }

  if (!commande) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="text-center text-gray-500">
          <div className="mb-4">Commande non trouvée</div>
          <Link
            href="/restaurant/commandes"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour aux commandes
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const getStatutBadge = (statut: string) => {
    const statutMap: Record<string, { bg: string; text: string; icon: React.ReactElement }> = {
      EN_ATTENTE: {
        bg: "bg-orange-50",
        text: "text-orange-700",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        ),
      },
      EN_PREPARATION: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        ),
      },
      SERVI: {
        bg: "bg-green-50",
        text: "text-green-700",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
          </svg>
        ),
      },
      PAYE: {
        bg: "bg-gray-50",
        text: "text-gray-700",
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        ),
      },
    };

    const config = statutMap[statut] || statutMap.EN_ATTENTE;
    const label = statut.replace("_", " ");

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border ${config.bg} ${config.text} border-current/20`}>
        {config.icon}
        {label}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4">
      {/* En-tête avec bouton retour et actions */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Link
              href="/restaurant/commandes"
              className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900 flex-shrink-0"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Commande #{commande.id}</h1>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 ml-10 sm:ml-13">Créée le {formatDate(commande.date_commande)}</div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <a
            href={`/api/exports/commande/${commande.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
            </svg>
            <span className="hidden sm:inline">Imprimer ticket</span>
            <span className="sm:hidden">PDF</span>
          </a>
          {commande.statut === "EN_ATTENTE" && canCancel && (
            <button
              onClick={cancelCommande}
              disabled={updating}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              <span className="hidden sm:inline">Annuler commande</span>
              <span className="sm:hidden">Annuler</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Informations principales */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm sm:text-base font-semibold text-gray-900">Informations principales</h2>
            </div>
            <div className="p-4 sm:p-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Table</dt>
                  <dd className="text-sm sm:text-base font-semibold text-gray-900">Table {commande.table_numero}</dd>
                </div>
                <div>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Statut</dt>
                  <dd className="text-sm sm:text-base">{getStatutBadge(commande.statut)}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Détails de la commande */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm sm:text-base font-semibold text-gray-900">Détails de la commande</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {commande.details.length === 0 ? (
                <div className="p-4 sm:p-6 text-center text-gray-500 text-sm">Aucun plat dans cette commande</div>
              ) : (
                commande.details.map((item) => (
                  <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm sm:text-base text-gray-900 mb-1 truncate">{item.repas.nom}</div>
                      <div className="text-xs sm:text-sm text-gray-600">
                        {Number(item.repas.prix).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC × {item.quantite}
                      </div>
                    </div>
                    <div className="text-sm sm:text-base font-semibold text-gray-900 whitespace-nowrap">
                      {Number(item.prix_total).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Colonne latérale */}
        <div className="space-y-4 sm:space-y-6">
          {/* Gestion de la commande */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm sm:text-base font-semibold text-gray-900">Gestion de la commande</h2>
            </div>
            <div className="p-4 sm:p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs sm:text-sm text-red-600">
                  {error}
                </div>
              )}
              <div className="space-y-3">
                {commande.statut === "EN_ATTENTE" && (
                  <button
                    onClick={() => updateStatut("EN_PREPARATION")}
                    disabled={updating}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {updating ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        <span className="hidden sm:inline">Mise à jour...</span>
                        <span className="sm:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">Commencer la préparation</span>
                        <span className="sm:hidden">Commencer</span>
                      </>
                    )}
                  </button>
                )}
                {commande.statut === "EN_PREPARATION" && (
                  <button
                    onClick={() => updateStatut("SERVI")}
                    disabled={updating}
                    className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {updating ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        <span className="hidden sm:inline">Mise à jour...</span>
                        <span className="sm:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">Marquer comme servi</span>
                        <span className="sm:hidden">Servi</span>
                      </>
                    )}
                  </button>
                )}
                {commande.statut === "SERVI" && (
                  <button
                    onClick={() => updateStatut("PAYE")}
                    disabled={updating}
                    className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {updating ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        <span className="hidden sm:inline">Mise à jour...</span>
                        <span className="sm:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">Marquer comme payé</span>
                        <span className="sm:hidden">Payé</span>
                      </>
                    )}
                  </button>
                )}
                {(commande.statut === "PAYE" || commande.statut === "SERVI") && (
                  <div className="text-center text-xs sm:text-sm text-gray-500 py-2">
                    Commande {commande.statut === "PAYE" ? "payée" : "servie"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Résumé financier */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-sm sm:text-base font-semibold text-gray-900">Résumé financier</h2>
            </div>
            <div className="p-4 sm:p-6">
              <dl className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <dt className="text-xs sm:text-sm font-medium text-gray-600">Sous-total</dt>
                  <dd className="text-xs sm:text-sm font-semibold text-gray-900">
                    {Number(commande.total).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
                  </dd>
                </div>
                <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-200">
                  <dt className="text-sm sm:text-base font-semibold text-gray-900">Total</dt>
                  <dd className="text-lg sm:text-xl font-bold text-gray-900">
                    {Number(commande.total).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
