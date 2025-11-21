"use client";

import { useEffect, useState } from "react";

interface ModalHistoriqueLocataireProps {
  isOpen: boolean;
  onClose: () => void;
  locataireId: number | null;
  locataireNom?: string;
}

interface HistoriqueData {
  id: number;
  nom: string;
  contact?: string | null;
  profession?: string | null;
  piece_identite?: string | null;
  contrats: any[];
}

export default function ModalHistoriqueLocataire({
  isOpen,
  onClose,
  locataireId,
  locataireNom,
}: ModalHistoriqueLocataireProps) {
  const [data, setData] = useState<HistoriqueData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !locataireId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/location/locataires/${locataireId}/historique`);
        if (!res.ok) {
          const contentType = res.headers.get("content-type");
          let message = "Impossible de charger l'historique";
          if (contentType && contentType.includes("application/json")) {
            const payload = await res.json();
            message = payload.error || message;
          }
          throw new Error(message);
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Erreur lors du chargement");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, locataireId]);

  const statut = (() => {
    if (!data) return "-";
    const contrats = data.contrats || [];
    const actifs = contrats.filter((c: any) => c.statut === "ACTIF");
    if (actifs.length > 0) return "Actif";
    if (contrats.length > 0) return "Ancien";
    return "En attente";
  })();

  if (!isOpen || !locataireId) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 px-3 py-6 sm:px-6 sm:py-10"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[28px] w-full max-w-5xl shadow-2xl border border-slate-100 flex flex-col max-h-[95vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-5 py-5 sm:px-8 sm:py-6 flex items-start justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/70 font-semibold">ACAJOU</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mt-1">
              Historique — {locataireNom || data?.nom || "Locataire"}
            </h2>
            <p className="text-white/80 text-sm mt-2 max-w-2xl">
              Consultez les contrats, paiements et informations associées à ce locataire.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-2xl font-light leading-none"
            aria-label="Fermer"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-3">
              <div className="h-10 w-10 border-4 border-white border-t-blue-500 rounded-full animate-spin" />
              Chargement de l'historique...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
              {error}
            </div>
          ) : data ? (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Contact</p>
                    <p className="font-semibold text-gray-900">{data.contact || "-"}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Profession</p>
                    <p className="font-semibold text-gray-900">{data.profession || "-"}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Statut</p>
                    <p className="font-semibold text-gray-900">{statut}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Contrats</p>
                    <p className="font-semibold text-gray-900">{data.contrats?.length || 0}</p>
                  </div>
                </div>
              </div>

              {data.contrats?.length ? (
                <div className="space-y-6">
                  {data.contrats.map((contrat: any) => (
                    <div
                      key={contrat.id}
                      className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
                    >
                      <div className="bg-blue-50 border-b border-gray-200 px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <p className="text-sm text-gray-600">Contrat #{contrat.id}</p>
                          <p className="text-base font-semibold text-gray-900">
                            {contrat.bien?.adresse || "Bien non renseigné"}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            contrat.statut === "ACTIF"
                              ? "bg-green-100 text-green-800"
                              : contrat.statut === "TERMINE"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {contrat.statut}
                        </span>
                      </div>
                      <div className="p-5 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Début</p>
                            <p className="font-medium text-gray-900">
                              {contrat.date_debut
                                ? new Date(contrat.date_debut).toLocaleDateString("fr-FR")
                                : "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Fin</p>
                            <p className="font-medium text-gray-900">
                              {contrat.date_fin ? new Date(contrat.date_fin).toLocaleDateString("fr-FR") : "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Dépôt de garantie</p>
                            <p className="font-medium text-gray-900">
                              {contrat.depot_garantie
                                ? `${Number(contrat.depot_garantie).toLocaleString("fr-FR")} FC`
                                : "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Avance</p>
                            <p className="font-medium text-gray-900">
                              {contrat.avance ? `${Number(contrat.avance).toLocaleString("fr-FR")} FC` : "-"}
                            </p>
                          </div>
                        </div>

                        {contrat.paiements?.length ? (
                          <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-900">Paiements</h3>
                            <div className="rounded-xl border border-gray-200 overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                  <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Date</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Montant</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Reste dû</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Pénalité</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {contrat.paiements.map((p: any) => (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                      <td className="px-4 py-3">
                                        {p.date_paiement
                                          ? new Date(p.date_paiement).toLocaleDateString("fr-FR")
                                          : "-"}
                                      </td>
                                      <td className="px-4 py-3 font-semibold text-gray-900">
                                        {Number(p.montant).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC
                                      </td>
                                      <td className="px-4 py-3">
                                        {Number(p.reste_du) > 0 ? (
                                          <span className="text-red-600 font-medium">
                                            {Number(p.reste_du).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC
                                          </span>
                                        ) : (
                                          <span className="text-green-600 font-medium">Payé</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3">
                                        {Number(p.penalite) > 0 ? (
                                          <span className="text-orange-600 font-medium">
                                            {Number(p.penalite).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC
                                          </span>
                                        ) : (
                                          <span className="text-gray-500">-</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Aucun paiement enregistré pour ce contrat.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">
                  Aucun contrat enregistré pour ce locataire.
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

