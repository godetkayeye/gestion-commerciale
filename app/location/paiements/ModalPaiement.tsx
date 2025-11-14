"use client";

import { useState, useEffect } from "react";

interface ModalPaiementProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalPaiement({ isOpen, onClose, onSuccess }: ModalPaiementProps) {
  const [contrats, setContrats] = useState<any[]>([]);
  const [form, setForm] = useState({
    contrat_id: "",
    montant: "",
    date_paiement: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculAuto, setCalculAuto] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      // Charger les contrats actifs
      fetch("/api/location/contrats")
        .then(r => r.json())
        .then(data => {
          // Filtrer seulement les contrats actifs
          const contratsActifs = data.filter((c: any) => c.statut === "ACTIF");
          setContrats(contratsActifs);
        });
      setForm({
        contrat_id: "",
        montant: "",
        date_paiement: new Date().toISOString().split('T')[0]
      });
      setCalculAuto(null);
      setError(null);
    }
  }, [isOpen]);

  const handleContratChange = async (contratId: string) => {
    if (!contratId) {
      setCalculAuto(null);
      setForm({ ...form, contrat_id: "", montant: "" });
      return;
    }

    setForm({ ...form, contrat_id: contratId });

    // Récupérer les détails du contrat
    const res = await fetch(`/api/location/contrats/${contratId}`);
    if (!res.ok) return;
    
    const contrat = await res.json();
    const bien = contrat.bien;
    
    if (!bien || !bien.prix_mensuel) {
      setError("Impossible de récupérer le prix mensuel du bien");
      return;
    }

    const loyerMensuel = Number(bien.prix_mensuel);
    const datePaiement = new Date(form.date_paiement || new Date().toISOString().split('T')[0]);
    const dateDebutContrat = new Date(contrat.date_debut);
    
    // Calculer le nombre de mois depuis le début du contrat jusqu'à la date de paiement
    const diffTime = datePaiement.getTime() - dateDebutContrat.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const moisAttendu = Math.max(1, Math.ceil(diffDays / 30)); // Au moins 1 mois
    
    // Récupérer les paiements précédents pour ce contrat
    const paiementsRes = await fetch(`/api/location/paiements?contrat_id=${contratId}`);
    const paiements = paiementsRes.ok ? await paiementsRes.json() : [];
    
    const totalPaye = paiements.reduce((acc: number, p: any) => acc + Number(p.montant), 0);
    const totalDu = loyerMensuel * moisAttendu;
    const resteDuAvantPaiement = Math.max(0, totalDu - totalPaye);
    
    // Calculer les pénalités (5% par mois de retard)
    // L'échéance est le même jour du mois suivant (ex: si début le 15/01, échéance le 15/02)
    const dateEcheanceMois = new Date(dateDebutContrat);
    dateEcheanceMois.setMonth(dateEcheanceMois.getMonth() + moisAttendu);
    
    // Si la date de paiement est après l'échéance, calculer le retard
    const joursRetard = Math.max(0, Math.floor((datePaiement.getTime() - dateEcheanceMois.getTime()) / (1000 * 60 * 60 * 24)));
    const moisRetard = Math.ceil(joursRetard / 30); // Arrondir au mois supérieur
    const penalite = moisRetard > 0 ? (loyerMensuel * 0.05 * moisRetard) : 0;

    setCalculAuto({
      loyerMensuel,
      moisAttendu,
      totalDu,
      totalPaye,
      resteDuAvantPaiement,
      joursRetard,
      moisRetard,
      penalite
    });

    // Pré-remplir le montant avec le reste dû
    setForm({ ...form, contrat_id: contratId, montant: String(Math.max(0, resteDuAvantPaiement)) });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!calculAuto) {
        throw new Error("Veuillez sélectionner un contrat");
      }

      const montant = Number(form.montant);
      if (montant <= 0) {
        throw new Error("Le montant doit être supérieur à 0");
      }

      // Calculer le reste dû après ce paiement
      const resteDuApresPaiement = Math.max(0, calculAuto.resteDuAvantPaiement - montant);

      const res = await fetch("/api/location/paiements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contrat_id: Number(form.contrat_id),
          montant: montant,
          date_paiement: form.date_paiement,
          reste_du: resteDuApresPaiement,
          penalite: calculAuto.penalite
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'enregistrement");
      }

      const paiement = await res.json();
      
      // Ouvrir automatiquement le PDF du reçu
      window.open(`/api/exports/recu-paiement-location/${paiement.id}`, "_blank");

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Nouveau paiement</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-light">&times;</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm mb-2 font-semibold text-gray-900">Contrat *</label>
            <select
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
              value={form.contrat_id}
              onChange={(e) => handleContratChange(e.target.value)}
              required
            >
              <option value="">Sélectionner un contrat</option>
              {contrats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.bien?.adresse || "Bien"} - {c.locataire?.nom || "Locataire"} ({c.statut})
                </option>
              ))}
            </select>
          </div>

          {calculAuto && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-gray-900 text-sm">Calcul automatique</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Loyer mensuel:</span>
                  <span className="ml-2 font-medium text-gray-900">{calculAuto.loyerMensuel.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC</span>
                </div>
                <div>
                  <span className="text-gray-600">Mois attendu:</span>
                  <span className="ml-2 font-medium text-gray-900">{calculAuto.moisAttendu}</span>
                </div>
                <div>
                  <span className="text-gray-600">Total dû:</span>
                  <span className="ml-2 font-medium text-gray-900">{calculAuto.totalDu.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC</span>
                </div>
                <div>
                  <span className="text-gray-600">Total payé:</span>
                  <span className="ml-2 font-medium text-gray-900">{calculAuto.totalPaye.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Reste dû avant paiement:</span>
                  <span className={`ml-2 font-bold ${calculAuto.resteDuAvantPaiement > 0 ? "text-red-700" : "text-green-700"}`}>
                    {calculAuto.resteDuAvantPaiement.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC
                  </span>
                </div>
                {calculAuto.joursRetard > 0 && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Retard:</span>
                    <span className="ml-2 font-medium text-orange-700">{calculAuto.joursRetard} jours ({calculAuto.moisRetard} mois)</span>
                  </div>
                )}
                {calculAuto.penalite > 0 && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Pénalité calculée:</span>
                    <span className="ml-2 font-bold text-orange-700">{calculAuto.penalite.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-2 font-semibold text-gray-900">Date de paiement *</label>
              <input
                type="date"
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                value={form.date_paiement}
                onChange={(e) => {
                  setForm({ ...form, date_paiement: e.target.value });
                  if (form.contrat_id) {
                    handleContratChange(form.contrat_id);
                  }
                }}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-2 font-semibold text-gray-900">Montant (FC) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                value={form.montant}
                onChange={(e) => setForm({ ...form, montant: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors"
              disabled={loading}
            >
              {loading ? "Enregistrement..." : "Enregistrer et imprimer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

