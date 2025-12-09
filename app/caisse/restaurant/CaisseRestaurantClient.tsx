"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import CreateCommandeModal from "@/app/restaurant/commandes/CreateCommandeModal";

type Commande = {
  id: number;
  table_numero: string | null;
  statut: string | null;
  total: number | null;
  date_commande: Date | string | null;
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
  boissons?: Array<{
    id: number;
    boisson_id: number;
    quantite: number;
    prix_unitaire: number;
    prix_total: number;
    boisson?: {
      id: number;
      nom: string;
      prix_vente: number;
    };
  }>;
};

type Paiement = {
  id: number;
  montant: number;
  mode_paiement: string;
  date_paiement: Date | string | null;
  reference_id: number | null;
};

type CurrentUser = {
  id: number;
  nom: string | null;
  email: string | null;
  role: string | null;
};

interface CaisseRestaurantClientProps {
  commandesEnAttente: Commande[];
  paiementsAujourdhui: Paiement[];
  totalAujourdhui: number;
  commandesEnAttenteCount: number;
  paiementsAujourdhuiCount: number;
  tauxChange: number;
  currentUser: CurrentUser | null;
}

export default function CaisseRestaurantClient({
  commandesEnAttente: initialCommandes,
  paiementsAujourdhui: initialPaiements,
  totalAujourdhui: initialTotal,
  commandesEnAttenteCount,
  paiementsAujourdhuiCount,
  tauxChange,
  currentUser,
}: CaisseRestaurantClientProps) {
  const router = useRouter();
  const [commandes, setCommandes] = useState<Commande[]>(initialCommandes);
  const [paiements, setPaiements] = useState<Paiement[]>(initialPaiements);
  const [totalAujourdhui, setTotalAujourdhui] = useState(initialTotal);
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatUSD = (montantFC: number) =>
    `${(montantFC / tauxChange).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;

  const formatDate = (dateInput: string | Date | null | undefined) => {
    if (!dateInput) return "Date non disponible";
    
    try {
      let date: Date;
      
      if (dateInput instanceof Date) {
        date = dateInput;
      } else if (typeof dateInput === 'string') {
        if (dateInput.includes('T')) {
          date = new Date(dateInput);
        } else if (dateInput.includes('-')) {
          date = new Date(dateInput + 'T00:00:00');
        } else {
          date = new Date(dateInput);
        }
      } else {
        date = new Date(dateInput);
      }
      
      if (isNaN(date.getTime())) {
        return "Date non disponible";
      }
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      return "Date non disponible";
    }
  };

  const handleCreated = (data: any) => {
    if (data && data.id) {
      const newCmd: Commande = {
        id: Number(data.id),
        table_numero: data.table_numero || "",
        statut: data.statut || "EN_ATTENTE",
        total: typeof data.total === "string" ? parseFloat(data.total) : typeof data.total === "number" ? data.total : 0,
        date_commande: data.date_commande || new Date(),
        details: data.details || [],
      };
      setCommandes((s) => [newCmd, ...s]);
    } else {
      window.location.reload();
    }
  };

  const handlePayer = async (commandeId: number) => {
    // Demander la devise avec SweetAlert
    const result = await Swal.fire({
      title: `Valider et encaisser la commande #${commandeId} ?`,
      text: "Choisissez la devise de paiement",
      icon: "question",
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "Francs (FC)",
      denyButtonText: "Dollars ($)",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#10b981",
      denyButtonColor: "#3b82f6",
      cancelButtonColor: "#6b7280",
    });
    
    if (result.isDismissed) {
      // L'utilisateur a annulé
      return;
    }
    
    const selectedDevise = result.isConfirmed ? "FRANC" : result.isDenied ? "DOLLAR" : null;
    if (!selectedDevise) return;
    
    setLoading(commandeId);
    setError(null);
    try {
      const res = await fetch(`/api/restaurant/commandes/${commandeId}/payer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ devise: selectedDevise }),
      });
      
      // Vérifier si la réponse est OK avant de parser le JSON
      if (!res.ok) {
        // Essayer de lire le message d'erreur
        let errorMessage = "Erreur lors du paiement";
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await res.json();
            errorMessage = errorData?.error || errorMessage;
          } else {
            errorMessage = `Erreur ${res.status}: ${res.statusText}`;
          }
        } catch {
          errorMessage = `Erreur ${res.status}: ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      // Vérifier que la réponse a du contenu avant de parser
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
      
      if (!data || !data.ok) {
        throw new Error(data?.error || "Erreur lors du paiement");
      }
      
      // Mettre à jour la commande
      setCommandes((s) => s.filter((c) => c.id !== commandeId));
      
      // Afficher un message de succès
      await Swal.fire({
        title: "Paiement effectué !",
        text: `La commande #${commandeId} a été encaissée avec succès.`,
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#10b981",
      });
      
      // Ouvrir automatiquement la facture
      window.open(`/api/exports/facture-restaurant/${commandeId}`, "_blank");
      
      // Recharger les paiements
      const paiementsRes = await fetch("/api/restaurant/paiements?aujourdhui=true");
      if (paiementsRes.ok) {
        const paiementsData = await paiementsRes.json();
        setPaiements(paiementsData);
        const nouveauTotal = paiementsData.reduce((acc: number, p: Paiement) => acc + Number(p.montant ?? 0), 0);
        setTotalAujourdhui(nouveauTotal);
      } else {
        // Recharger la page pour avoir les données à jour
        window.location.reload();
      }
    } catch (err: any) {
      console.error("Erreur lors du paiement:", err);
      await Swal.fire({
        title: "Erreur",
        text: err.message || "Erreur lors de l'encaissement",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#ef4444",
      });
      setError(err.message || "Erreur lors de l'encaissement");
    } finally {
      setLoading(null);
    }
  };

  const getStatutBadge = (statut: string | null) => {
    const statutMap: Record<string, { bg: string; text: string; label: string }> = {
      EN_ATTENTE: { bg: "bg-orange-50", text: "text-orange-700", label: "En attente" },
      EN_PREPARATION: { bg: "bg-blue-50", text: "text-blue-700", label: "En préparation" },
      SERVI: { bg: "bg-green-50", text: "text-green-700", label: "Servie" },
      PAYE: { bg: "bg-gray-50", text: "text-gray-700", label: "Payée" },
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
          <div className="text-xs sm:text-sm text-gray-500">Commandes en attente</div>
          <div className="mt-1 text-xl sm:text-2xl font-semibold text-orange-600">{commandesEnAttenteCount}</div>
        </div>
        <div className="rounded-lg border bg-white p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-500">Paiements aujourd'hui</div>
          <div className="mt-1 text-xl sm:text-2xl font-semibold text-blue-600">{paiementsAujourdhuiCount}</div>
        </div>
        <div className="rounded-lg border bg-white p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-500">Total encaissé (aujourd'hui)</div>
          <div className="mt-1 text-xl sm:text-2xl font-semibold text-green-600">
            {formatUSD(totalAujourdhui)}
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
              onClick={() => setOpenModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-medium shadow-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
              </svg>
              Nouvelle commande
            </button>
            <Link
              href="/caisse/restaurant/rapports"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs sm:text-sm font-medium shadow-sm transition-colors"
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
        {/* Commandes en attente */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-orange-50 border-b border-gray-200 px-3 md:px-4 py-2 md:py-3 flex justify-between items-center">
            <h2 className="text-base md:text-lg font-semibold text-gray-900">Commandes en attente de paiement</h2>
            <span className="text-xs md:text-sm font-medium text-orange-600">{commandes.length} commande{commandes.length > 1 ? "s" : ""}</span>
          </div>
          <div className="overflow-x-auto">
            {commandes.length === 0 ? (
              <div className="p-6 md:p-8 text-center text-gray-500">
                <div className="text-sm md:text-base mb-2">✓</div>
                <div className="text-xs md:text-sm text-gray-500 font-medium">Aucune commande en attente</div>
                <div className="text-xs text-gray-400 mt-1">Toutes les commandes sont payées</div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {commandes.map((c) => (
                  <div key={c.id} className="p-3 md:p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-2 md:mb-3">
                      <div>
                        <div className="font-semibold text-sm md:text-base text-gray-900">Commande #{c.id}</div>
                        <div className="text-xs md:text-sm text-gray-600 mt-1">Table {c.table_numero || "-"}</div>
                      </div>
                      {getStatutBadge(c.statut)}
                    </div>
                    <div className="space-y-1.5 md:space-y-2 mb-2 md:mb-3">
                      {/* Afficher les plats */}
                      {c.details && c.details.length > 0 && c.details.map((d) => (
                        <div key={d.id} className="flex justify-between text-xs md:text-sm">
                          <span className="text-gray-700">
                            {d.repas?.nom || `Plat #${d.repas_id}`} × {d.quantite}
                          </span>
                          <span className="text-gray-900 font-medium">
                            ${((Number(d.prix_total || 0)) / tauxChange).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({Number(d.prix_total || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC)
                          </span>
                        </div>
                      ))}
                      {/* Afficher les boissons */}
                      {c.boissons && Array.isArray(c.boissons) && c.boissons.length > 0 && c.boissons.map((b: any) => (
                        <div key={b.id || `boisson-${b.boisson_id}`} className="flex justify-between text-xs md:text-sm">
                          <span className="text-gray-700">
                            {b.boisson?.nom || `Boisson #${b.boisson_id}`} × {b.quantite || 0}
                          </span>
                          <span className="text-gray-900 font-medium">
                            ${((Number(b.prix_total || 0)) / tauxChange).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({Number(b.prix_total || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC)
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2 md:pt-3 border-t border-gray-100">
                      <div className="text-base md:text-lg font-bold text-gray-900">
                        ${((Number(c.total ?? 0)) / tauxChange).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({Number(c.total ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC)
                      </div>
                      <button
                        onClick={() => handlePayer(c.id)}
                        disabled={loading === c.id || c.statut === "PAYE"}
                        className="px-3 md:px-4 py-1.5 md:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs md:text-sm font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {loading === c.id ? "..." : "Encaisser"}
                      </button>
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
                          Commande #{p.reference_id || "-"} • {p.mode_paiement}
                        </div>
                        {p.date_paiement && (
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(p.date_paiement)}
                          </div>
                        )}
                      </div>
                      <div className="text-base md:text-lg font-bold text-green-600 ml-4">
                        {formatUSD(Number(p.montant))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateCommandeModal
        open={openModal}
        onCloseAction={() => setOpenModal(false)}
        onCreatedAction={handleCreated}
        currentUser={currentUser}
      />
    </div>
  );
}

