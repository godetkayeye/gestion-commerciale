"use client";

import { useEffect, useState } from "react";

type Personnel = { id: number; nom: string };

type Commission = {
  id: number;
  personnel_id: number;
  montant: number;
  periode: string | Date;
  personnel?: Personnel;
};

export default function CommissionsClient() {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    personnel_id: "",
    periode: new Date().toISOString().slice(0, 7), // YYYY-MM par défaut
    taux_commission: "5",
  });

  useEffect(() => {
    // Charger le personnel et les dernières commissions
    Promise.all([
      fetch("/api/bar/personnel").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/bar/commissions").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([pers, comms]) => {
        setPersonnel(Array.isArray(pers) ? pers : []);
        setCommissions(Array.isArray(comms) ? comms : []);
      })
      .catch(() => {})
      .finally(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.personnel_id) {
      setError("Sélectionnez un membre du personnel");
      return;
    }
    if (!form.periode) {
      setError("Spécifiez une période");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/bar/commissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personnel_id: Number(form.personnel_id),
          periode: form.periode,
          taux_commission: Number(form.taux_commission || 0),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur lors du calcul");

      // Recharger la liste
      const latest = await fetch("/api/bar/commissions").then((r) => (r.ok ? r.json() : []));
      setCommissions(Array.isArray(latest) ? latest : []);
    } catch (err: any) {
      setError(err.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (v: any) => {
    try {
      if (!v) return "-";
      const d = typeof v === "string" ? new Date(v) : v;
      if (isNaN(d.getTime())) return v;
      return d.toLocaleDateString("fr-FR", { year: "numeric", month: "2-digit", day: "2-digit" });
    } catch {
      return "-";
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Calculer une commission</h3>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>
        )}
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-2 font-semibold text-gray-900">Personnel *</label>
            <select
              value={form.personnel_id}
              onChange={(e) => setForm({ ...form, personnel_id: e.target.value })}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
              required
            >
              <option value="">Sélectionner</option>
              {personnel.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2 font-semibold text-gray-900">Période *</label>
            <input
              type="month"
              value={form.periode}
              onChange={(e) => setForm({ ...form, periode: e.target.value })}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-2 font-semibold text-gray-900">Taux (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={form.taux_commission}
              onChange={(e) => setForm({ ...form, taux_commission: e.target.value })}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
            />
          </div>
          <div className="md:col-span-3 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setForm({ personnel_id: "", periode: new Date().toISOString().slice(0, 7), taux_commission: "5" })}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
            >
              Réinitialiser
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm disabled:opacity-50"
            >
              {loading ? "Calcul en cours..." : "Calculer"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Historique des commissions</h3>
        </div>
        <table className="w-full">
          <thead className="bg-blue-50 border-b border-gray-200">
            <tr>
              <th className="text-left p-4 text-sm font-semibold text-gray-900">Période</th>
              <th className="text-left p-4 text-sm font-semibold text-gray-900">Personnel</th>
              <th className="text-right p-4 text-sm font-semibold text-gray-900">Montant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {commissions.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-gray-500">Aucune commission calculée</td>
              </tr>
            ) : (
              commissions.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-gray-900">{formatDate(c.periode)}</td>
                  <td className="p-4 text-gray-900">{c.personnel?.nom || c.personnel_id}</td>
                  <td className="p-4 text-right font-semibold text-gray-900">{Number(c.montant).toLocaleString()} FC</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
