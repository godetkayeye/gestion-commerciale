"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ModalContrat from "@/app/location/contrats/ModalContrat";
import ModalPaiement from "@/app/location/paiements/ModalPaiement";

type Contrat = {
  id: number;
  bien_id: number;
  locataire_id: number;
  date_debut: Date | string | null;
  date_fin: Date | string | null;
  statut: string | null;
  depot_garantie: number | null;
  avance: number | null;
  bien: {
    id: number;
    adresse: string;
    type: string;
  } | null;
  locataire: {
    id: number;
    nom: string;
  } | null;
};

type Paiement = {
  id: number;
  contrat_id: number;
  montant: number;
  date_paiement: Date | string | null;
  reste_du: number | null;
  penalite: number | null;
  contrat: {
    id: number;
    bien: {
      adresse: string;
    } | null;
    locataire: {
      nom: string;
    } | null;
  } | null;
};

interface CaisseLocationClientProps {
  contratsEnAttente: Contrat[];
  paiementsAujourdhui: Paiement[];
  totalAujourdhui: number;
  contratsEnAttenteCount: number;
  paiementsAujourdhuiCount: number;
}

export default function CaisseLocationClient({
  contratsEnAttente: initialContrats,
  paiementsAujourdhui: initialPaiements,
  totalAujourdhui: initialTotal,
  contratsEnAttenteCount,
  paiementsAujourdhuiCount,
}: CaisseLocationClientProps) {
  const router = useRouter();
  const [contrats, setContrats] = useState<Contrat[]>(initialContrats);
  const [paiements, setPaiements] = useState<Paiement[]>(initialPaiements);
  const [totalAujourdhui, setTotalAujourdhui] = useState(initialTotal);
  const [openModalContrat, setOpenModalContrat] = useState(false);
  const [openModalPaiement, setOpenModalPaiement] = useState(false);
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleContratCreated = () => {
    router.refresh();
  };

  const handlePaiementCreated = () => {
    router.refresh();
  };

  const handleValiderContrat = async (contratId: number) => {
    if (!confirm(`Valider le contrat #${contratId} ?`)) return;
    setLoading(contratId);
    setError(null);
    try {
      // Récupérer d'abord le contrat pour avoir tous les champs
      const contratRes = await fetch(`/api/location/contrats/${contratId}`);
      if (!contratRes.ok) {
        throw new Error("Erreur lors de la récupération du contrat");
      }
      const contrat = await contratRes.json();

      // Mettre à jour avec tous les champs nécessaires
      const res = await fetch(`/api/location/contrats/${contratId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bien_id: contrat.bien_id,
          locataire_id: contrat.locataire_id,
          date_debut: contrat.date_debut,
          date_fin: contrat.date_fin,
          depot_garantie: contrat.depot_garantie,
          avance: contrat.avance,
          statut: "ACTIF",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error || "Erreur lors de la validation");
      }

      // Retirer le contrat de la liste (il est maintenant validé)
      setContrats((s) => s.filter((c) => c.id !== contratId));
    } catch (err: any) {
      console.error("Erreur lors de la validation:", err);
      setError(err.message || "Erreur lors de la validation");
    } finally {
      setLoading(null);
    }
  };

  const getStatutBadge = (statut: string | null) => {
    const statutMap: Record<string, { bg: string; text: string; label: string }> = {
      EN_ATTENTE: { bg: "bg-orange-50", text: "text-orange-700", label: "En attente" },
      ACTIF: { bg: "bg-green-50", text: "text-green-700", label: "Actif" },
      TERMINE: { bg: "bg-gray-50", text: "text-gray-700", label: "Terminé" },
    };
    const config = statutMap[statut || ""] || statutMap.EN_ATTENTE;
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-red-700 font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-lg border bg-white p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-500">Contrats en attente/actifs</div>
          <div className="mt-1 text-xl sm:text-2xl font-semibold text-orange-600">{contratsEnAttenteCount}</div>
        </div>
        <div className="rounded-lg border bg-white p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-500">Paiements aujourd'hui</div>
          <div className="mt-1 text-xl sm:text-2xl font-semibold text-blue-600">{paiementsAujourdhuiCount}</div>
        </div>
        <div className="rounded-lg border bg-white p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-500">Total encaissé (aujourd'hui)</div>
          <div className="mt-1 text-xl sm:text-2xl font-semibold text-green-600">
            {totalAujourdhui.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-indigo-50 border-b border-gray-200 px-3 md:px-4 py-2 md:py-3">
          <h2 className="text-base md:text-lg font-semibold text-gray-900">Actions rapides</h2>
        </div>
        <div className="p-3 md:p-4">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={() => setOpenModalContrat(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-medium shadow-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
              </svg>
              Nouveau contrat
            </button>
            <button
              onClick={() => setOpenModalPaiement(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs sm:text-sm font-medium shadow-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              Enregistrer un paiement
            </button>
            <Link
              href="/caisse/location/rapports"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs sm:text-sm font-medium shadow-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              Rapports financiers
            </Link>
          </div>
        </div>
      </div>

      {/* Grille responsive - 1 colonne sur mobile, 2 sur desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Contrats en attente/actifs */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-orange-50 border-b border-gray-200 px-3 md:px-4 py-2 md:py-3 flex justify-between items-center">
            <h2 className="text-base md:text-lg font-semibold text-gray-900">Contrats en attente/actifs</h2>
            <span className="text-xs md:text-sm font-medium text-orange-600">{contrats.length} contrat{contrats.length > 1 ? "s" : ""}</span>
          </div>
          <div className="overflow-x-auto">
            {contrats.length === 0 ? (
              <div className="p-6 md:p-8 text-center text-gray-500">
                <div className="text-sm md:text-base mb-2">✓</div>
                <div className="text-xs md:text-sm text-gray-500 font-medium">Aucun contrat en attente</div>
                <div className="text-xs text-gray-400 mt-1">Tous les contrats sont validés</div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {contrats.map((c) => (
                  <div key={c.id} className="p-3 md:p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2 md:mb-3">
                      <div>
                        <div className="font-semibold text-sm md:text-base text-gray-900">Contrat #{c.id}</div>
                        <div className="text-xs md:text-sm text-gray-600 mt-1">
                          {c.bien?.adresse || "-"} • {c.locataire?.nom || "-"}
                        </div>
                        {c.date_debut && (
                          <div className="text-xs text-gray-500 mt-1">
                            Du {new Date(c.date_debut).toLocaleDateString("fr-FR")}
                            {c.date_fin && ` au ${new Date(c.date_fin).toLocaleDateString("fr-FR")}`}
                          </div>
                        )}
                      </div>
                      {getStatutBadge(c.statut)}
                    </div>
                    <div className="flex items-center justify-between pt-2 md:pt-3 border-t border-gray-100">
                      <div className="text-xs md:text-sm text-gray-600">
                        {c.avance && (
                          <span>Avance: {Number(c.avance).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC</span>
                        )}
                      </div>
                      {c.statut === "EN_ATTENTE" && (
                        <button
                          onClick={() => handleValiderContrat(c.id)}
                          disabled={loading === c.id}
                          className="px-3 md:px-4 py-1.5 md:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs md:text-sm font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          {loading === c.id ? "..." : "Valider"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Paiements récents */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-green-50 border-b border-gray-200 px-3 md:px-4 py-2 md:py-3 flex justify-between items-center">
            <h2 className="text-base md:text-lg font-semibold text-gray-900">Paiements récents (aujourd'hui)</h2>
            <span className="text-xs md:text-sm font-medium text-green-600">{paiements.length} paiement{paiements.length > 1 ? "s" : ""}</span>
          </div>
          <div className="overflow-x-auto">
            {paiements.length === 0 ? (
              <div className="p-6 md:p-8 text-center text-gray-500">
                <div className="text-sm md:text-base mb-2">—</div>
                <div className="text-xs md:text-sm text-gray-500 font-medium">Aucun paiement aujourd'hui</div>
                <div className="text-xs text-gray-400 mt-1">Les paiements apparaîtront ici</div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {paiements.map((p) => (
                  <div key={p.id} className="p-3 md:p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm md:text-base text-gray-900">Paiement #{p.id}</div>
                        <div className="text-xs md:text-sm text-gray-600 mt-1">
                          Contrat #{p.contrat_id} • {p.contrat?.bien?.adresse || "-"}
                        </div>
                        <div className="text-xs md:text-sm text-gray-600 mt-1">
                          {p.contrat?.locataire?.nom || "-"}
                        </div>
                        {p.date_paiement && (
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(p.date_paiement).toLocaleString("fr-FR")}
                          </div>
                        )}
                        {Number(p.reste_du) > 0 && (
                          <div className="text-xs text-red-600 mt-1 font-medium">
                            Reste dû: {Number(p.reste_du).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
                          </div>
                        )}
                        {Number(p.penalite) > 0 && (
                          <div className="text-xs text-orange-600 mt-1 font-medium">
                            Pénalité: {Number(p.penalite).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
                          </div>
                        )}
                      </div>
                      <div className="text-base md:text-lg font-bold text-green-600 ml-4">
                        {Number(p.montant).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ModalContrat
        isOpen={openModalContrat}
        onClose={() => setOpenModalContrat(false)}
        onSuccess={handleContratCreated}
        editingItem={null}
      />
      <ModalPaiement
        isOpen={openModalPaiement}
        onClose={() => setOpenModalPaiement(false)}
        onSuccess={handlePaiementCreated}
      />
    </div>
  );
}

