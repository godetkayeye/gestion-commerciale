"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type PeriodStats = {
  total: number;
  benefice: number;
  count: number;
};

type ProductStats = {
  id: number;
  nom: string;
  quantite_vendue: number;
  total_ventes: number;
  benefice: number;
};

type Stats = {
  daily: PeriodStats;
  weekly: PeriodStats;
  monthly: PeriodStats;
  products: ProductStats[];
};

export default function RapportsClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Fonction pour charger les statistiques
  const loadStats = async (date: string) => {
    try {
      setLoading(true);
      setError(null);
      const url = new URL("/api/pharmacie/stats", window.location.origin);
      url.searchParams.set("date", date);
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("Erreur lors du chargement des statistiques");
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError("Impossible de charger les statistiques");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Charger les stats au montage et quand la date change
  useEffect(() => {
    loadStats(selectedDate);
  }, [selectedDate]);

  const formatMoney = (amount: number) => amount.toFixed(2) + " FC";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement des statistiques...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg text-red-600">
        {error}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
        <label className="text-sm font-medium text-gray-700">Date :</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={() => loadStats(selectedDate)}
          className="px-4 py-1.5 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700"
        >
          Actualiser
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Daily Stats */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Aujourd'hui</h3>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600">Ventes</div>
              <div className="text-2xl font-semibold text-gray-900">
                {formatMoney(stats.daily.total)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Bénéfices</div>
              <div className="text-xl font-medium text-green-600">
                {formatMoney(stats.daily.benefice)}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {stats.daily.count} vente(s)
            </div>
          </div>
        </div>

        {/* Weekly Stats */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Cette semaine</h3>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600">Ventes</div>
              <div className="text-2xl font-semibold text-gray-900">
                {formatMoney(stats.weekly.total)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Bénéfices</div>
              <div className="text-xl font-medium text-green-600">
                {formatMoney(stats.weekly.benefice)}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {stats.weekly.count} vente(s)
            </div>
          </div>
        </div>

        {/* Monthly Stats */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Ce mois</h3>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600">Ventes</div>
              <div className="text-2xl font-semibold text-gray-900">
                {formatMoney(stats.monthly.total)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Bénéfices</div>
              <div className="text-xl font-medium text-green-600">
                {formatMoney(stats.monthly.benefice)}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {stats.monthly.count} vente(s)
            </div>
          </div>
        </div>
      </div>

      {/* Products Report */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Rapport par produit</h3>
          <div className="flex items-center gap-2">
            <Link
              href={`/api/exports/pharmacie/rapport/excel?date=${selectedDate}`}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Excel
            </Link>
            <Link
              href={`/api/exports/pharmacie/rapport/pdf?date=${selectedDate}`}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              PDF
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-sm text-gray-600">
              <tr>
                <th className="py-3 px-4 text-left font-medium">Produit</th>
                <th className="py-3 px-4 text-right font-medium">Quantité vendue</th>
                <th className="py-3 px-4 text-right font-medium">Total ventes</th>
                <th className="py-3 px-4 text-right font-medium">Bénéfice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{product.nom}</td>
                  <td className="py-3 px-4 text-sm text-gray-900 text-right">{product.quantite_vendue}</td>
                  <td className="py-3 px-4 text-sm text-gray-900 text-right">{formatMoney(product.total_ventes)}</td>
                  <td className="py-3 px-4 text-sm font-medium text-green-600 text-right">{formatMoney(product.benefice)}</td>
                </tr>
              ))}
              {stats.products.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    Aucune donnée disponible pour cette période
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}