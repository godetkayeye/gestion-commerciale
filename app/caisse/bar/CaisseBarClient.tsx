"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ModalNouvelleCommandeBar from "@/app/components/ModalNouvelleCommandeBar";

type CommandeBar = {
  id: number;
  status: string | null;
  date_commande: Date | string | null;
  table: {
    id: number;
    nom: string;
  } | null;
  serveur: {
    id: number;
    nom: string;
  } | null;
  details: Array<{
    id: number;
    boisson_id: number;
    quantite: number;
    prix_total: number;
    boisson: {
      nom: string;
      prix: number;
    };
  }>;
};

type Facture = {
  id: number;
  total: number;
  taxes: number;
  date_facture: Date | string | null;
  commande_id: number | null;
  commande: {
    id: number;
    table: {
      nom: string;
    } | null;
    serveur: {
      nom: string;
    } | null;
  } | null;
};

interface CaisseBarClientProps {
  commandesEnAttente: CommandeBar[];
  facturesAujourdhui: Facture[];
  totalAujourdhui: number;
  commandesEnAttenteCount: number;
  facturesAujourdhuiCount: number;
  tauxChange: number;
}

export default function CaisseBarClient({
  commandesEnAttente: initialCommandes,
  facturesAujourdhui: initialFactures,
  totalAujourdhui: initialTotal,
  commandesEnAttenteCount,
  facturesAujourdhuiCount,
  tauxChange,
}: CaisseBarClientProps) {
  const router = useRouter();
  const [commandes, setCommandes] = useState<CommandeBar[]>(initialCommandes);
  const [factures, setFactures] = useState<Facture[]>(initialFactures);
  const [totalAujourdhui, setTotalAujourdhui] = useState(initialTotal);
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatUSD = (montantFC: number) =>
    `${(montantFC / tauxChange).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`;

  const handleCreated = () => {
    window.location.reload();
  };

  const handleEncaisser = async (commandeId: number) => {
    if (!confirm(`Valider et encaisser la commande #${commandeId} ?`)) return;
    setLoading(commandeId);
    setError(null);
    try {
      const res = await fetch(`/api/bar/commandes/${commandeId}/facturer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      // Vérifier si la réponse est OK avant de parser le JSON
      if (!res.ok) {
        let errorMessage = "Erreur lors de l'encaissement";
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
        throw new Error(data?.error || "Erreur lors de l'encaissement");
      }
      
      // Mettre à jour la commande
      setCommandes((s) => s.filter((c) => c.id !== commandeId));
      
      // Recharger les factures
      const facturesRes = await fetch("/api/bar/factures?aujourdhui=true");
      if (facturesRes.ok) {
        const facturesData = await facturesRes.json();
        setFactures(facturesData);
        const nouveauTotal = facturesData.reduce((acc: number, f: Facture) => acc + Number(f.total ?? 0), 0);
        setTotalAujourdhui(nouveauTotal);
      } else {
        // Recharger la page pour avoir les données à jour
        window.location.reload();
      }
    } catch (err: any) {
      console.error("Erreur lors de l'encaissement:", err);
      setError(err.message || "Erreur lors de l'encaissement");
    } finally {
      setLoading(null);
    }
  };

  const getStatutBadge = (status: string | null) => {
    const statutMap: Record<string, { bg: string; text: string; label: string }> = {
      EN_COURS: { bg: "bg-orange-50", text: "text-orange-700", label: "En cours" },
      VALIDEE: { bg: "bg-green-50", text: "text-green-700", label: "Validée" },
      ANNULEE: { bg: "bg-red-50", text: "text-red-700", label: "Annulée" },
    };
    const config = statutMap[status || ""] || statutMap.EN_COURS;
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // Calculer le total de chaque commande
  const calculerTotalCommande = (commande: CommandeBar) => {
    return commande.details.reduce((acc, d) => acc + Number(d.prix_total), 0);
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
          <div className="text-xs sm:text-sm text-gray-500">Factures aujourd'hui</div>
          <div className="mt-1 text-xl sm:text-2xl font-semibold text-blue-600">{facturesAujourdhuiCount}</div>
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
              href="/caisse/bar/rapports"
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
                <div className="text-xs text-gray-400 mt-1">Toutes les commandes sont validées</div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {commandes.map((c) => {
                  const totalCommande = calculerTotalCommande(c);
                  return (
                    <div key={c.id} className="p-3 md:p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2 md:mb-3">
                        <div>
                          <div className="font-semibold text-sm md:text-base text-gray-900">Commande #{c.id}</div>
                          <div className="text-xs md:text-sm text-gray-600 mt-1">
                            Table {c.table?.nom || "-"} {c.serveur ? `• ${c.serveur.nom}` : ""}
                          </div>
                        </div>
                        {getStatutBadge(c.status)}
                      </div>
                      <div className="space-y-1.5 md:space-y-2 mb-2 md:mb-3">
                        {c.details.map((d) => (
                          <div key={d.id} className="flex justify-between text-xs md:text-sm">
                            <span className="text-gray-700">
                              {d.boisson?.nom || "Boisson"} × {d.quantite}
                            </span>
                            <span className="text-gray-900 font-medium">
                              ${((Number(d.prix_total)) / tauxChange).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({Number(d.prix_total).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC)
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-2 md:pt-3 border-t border-gray-100">
                        <div className="text-base md:text-lg font-bold text-gray-900">
                          ${(totalCommande / tauxChange).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({totalCommande.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC)
                        </div>
                        <button
                          onClick={() => handleEncaisser(c.id)}
                          disabled={loading === c.id || c.status === "VALIDEE"}
                          className="px-3 md:px-4 py-1.5 md:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs md:text-sm font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          {loading === c.id ? "..." : "Encaisser"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Factures récentes */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-green-50 border-b border-gray-200 px-3 md:px-4 py-2 md:py-3 flex justify-between items-center">
            <h2 className="text-base md:text-lg font-semibold text-gray-900">Factures récentes (aujourd'hui)</h2>
            <span className="text-xs md:text-sm font-medium text-green-600">{factures.length} facture{factures.length > 1 ? "s" : ""}</span>
          </div>
          <div className="overflow-x-auto">
            {factures.length === 0 ? (
              <div className="p-6 md:p-8 text-center text-gray-500">
                <div className="text-sm md:text-base mb-2">—</div>
                <div className="text-xs md:text-sm text-gray-500 font-medium">Aucune facture aujourd'hui</div>
                <div className="text-xs text-gray-400 mt-1">Les factures apparaîtront ici</div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {factures.map((f) => (
                  <div key={f.id} className="p-3 md:p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm md:text-base text-gray-900">Facture #{f.id}</div>
                        <div className="text-xs md:text-sm text-gray-600 mt-1">
                          Commande #{f.commande_id || "-"} {f.commande?.table ? `• Table ${f.commande.table.nom}` : ""}
                        </div>
                        {f.date_facture && (
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(f.date_facture).toLocaleString("fr-FR")}
                          </div>
                        )}
                      </div>
                      <div className="text-base md:text-lg font-bold text-green-600 ml-4">
                        {Number(f.total).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FC
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ModalNouvelleCommandeBar
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={handleCreated}
      />
    </div>
  );
}

