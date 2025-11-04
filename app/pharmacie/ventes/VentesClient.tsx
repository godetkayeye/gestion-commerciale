"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Vente = {
  id: number;
  date_vente: string | null;
  total: number | null;
  details?: { id: number; quantite: number; prix_total: number; medicament?: { id: number; nom: string } | null }[];
};

type ProduitOption = { id: number; nom: string; prix_unitaire: number | string; quantite_stock: number };

export default function VentesClient({ initial, userRole }: { initial: Vente[]; userRole?: string | null }) {
  const [ventes, setVentes] = useState<Vente[]>(initial);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [produits, setProduits] = useState<ProduitOption[]>([]);

  // form items: array of { medicament_id, quantite }
  const [items, setItems] = useState<{ medicament_id: number | null; quantite: number | null }[]>([
    { medicament_id: null, quantite: null },
  ]);

  useEffect(() => {
    // fetch produits for select and normalize prix_unitaire to number
    fetch("/api/pharmacie/medicaments")
      .then((r) => r.json())
      .then((data: unknown[]) => {
        const normalized = (data || []).map((p: unknown) => {
          const obj = p as Record<string, unknown>;
          return {
            id: Number(obj.id),
            nom: String(obj.nom),
            prix_unitaire: Number(obj.prix_unitaire ?? 0),
            quantite_stock: Number(obj.quantite_stock ?? 0),
          };
        });
        setProduits(normalized);
      })
      .catch(() => setProduits([]));
  }, []);

  // filtering/search state
  const [filterPeriod, setFilterPeriod] = useState<"daily" | "weekly" | "monthly" | "all">("all");
  const [filterStartDate, setFilterStartDate] = useState<string | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<string | null>(null);
  const [filterProductId, setFilterProductId] = useState<number | null>(null);
  const [filterLoading, setFilterLoading] = useState(false);

  // fetch ventes with optional filters
  async function fetchVentes(params?: { period?: string; startDate?: string | null; endDate?: string | null; productId?: number | null }) {
    try {
      setFilterLoading(true);
      const url = new URL('/api/pharmacie/ventes', location.origin);
      if (params?.period && params.period !== 'all') url.searchParams.set('period', params.period);
      if (params?.startDate) url.searchParams.set('startDate', params.startDate);
      if (params?.endDate) url.searchParams.set('endDate', params.endDate);
      if (params?.productId) url.searchParams.set('productId', String(params.productId));

      const r = await fetch(url.toString());
      const data = await r.json();
      if (!Array.isArray(data)) return;
      const normalized = (data as unknown[]).map((v: unknown) => {
        const vv = v as Record<string, unknown>;
        return {
          id: Number(vv.id),
          date_vente: vv.date_vente ? new Date(String(vv.date_vente)).toISOString() : null,
          total: vv.total !== undefined && vv.total !== null ? Number(vv.total) : null,
          details: ((vv.details as unknown[]) || []).map((d: unknown) => {
            const dd = d as Record<string, unknown>;
            return {
              id: Number(dd.id),
              quantite: Number(dd.quantite),
              prix_total: dd.prix_total !== undefined && dd.prix_total !== null ? Number(dd.prix_total) : 0,
              medicament: dd.medicament ? { id: Number((dd.medicament as Record<string, unknown>).id), nom: String((dd.medicament as Record<string, unknown>).nom) } : null,
            };
          }),
        };
      });
      setVentes(normalized);
    } catch {
      // ignore
    } finally {
      setFilterLoading(false);
    }
  }

  // initial fetch on mount
  useEffect(() => {
    fetchVentes();
  }, []);

  // compute estimated total for current items
  const estimatedTotal = useMemo(() => {
    return items.reduce((acc, it) => {
      if (!it.medicament_id || !it.quantite) return acc;
      const prod = produits.find((p) => p.id === Number(it.medicament_id));
      const price = prod ? Number(prod.prix_unitaire || 0) : 0;
      return acc + price * Number(it.quantite);
    }, 0);
  }, [items, produits]);

  // summary for displayed ventes and top products
  const { ventesSummary, topProducts } = useMemo(() => {
    const count = ventes.length;
    const sum = ventes.reduce((acc, v) => acc + (v.total ?? 0), 0);
    
    // Calculate top products
    const productSales = new Map<number, { id: number, nom: string, quantite: number, total: number }>();
    
    ventes.forEach(vente => {
      vente.details?.forEach(detail => {
        if (detail.medicament) {
          const { id, nom } = detail.medicament;
          const current = productSales.get(id) ?? { id, nom, quantite: 0, total: 0 };
          productSales.set(id, {
            ...current,
            quantite: current.quantite + detail.quantite,
            total: current.total + (detail.prix_total ?? 0)
          });
        }
      });
    });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.quantite - a.quantite)
      .slice(0, 5);

    return { 
      ventesSummary: { count, sum },
      topProducts 
    };
  }, [ventes]);

  function updateItem(idx: number, patch: Partial<{ medicament_id: number | null; quantite: number | null }>) {
    setItems((cur) => cur.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function addRow() {
    setItems((s) => [...s, { medicament_id: null, quantite: null }]);
  }

  function removeRow(idx: number) {
    setItems((s) => s.filter((_, i) => i !== idx));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        items: items
          .filter((it) => it.medicament_id && it.quantite)
          .map((it) => ({ medicament_id: Number(it.medicament_id), quantite: Number(it.quantite) })),
      };

      if (payload.items.length === 0) throw new Error("Ajoutez au moins un produit avec quantité");

      // validate stock availability
      for (const it of payload.items) {
        const prod = produits.find((p) => p.id === Number(it.medicament_id));
        if (!prod) throw new Error(`Produit ${it.medicament_id} introuvable`);
        if (Number(prod.quantite_stock) < Number(it.quantite)) {
          throw new Error(`Stock insuffisant pour ${prod.nom} (max ${prod.quantite_stock})`);
        }
      }

      const res = await fetch("/api/pharmacie/ventes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la création de la vente");

      // push new vente into list (minimal)
      setVentes((v) => [{ id: data.id, date_vente: new Date().toISOString(), total: null }, ...v]);
      setOpen(false);
      setItems([{ medicament_id: null, quantite: null }]);
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800">Ventes</h2>
        <div className="flex items-center gap-4">
          <Link href="/pharmacie/ventes" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Toutes les ventes</Link>
          <button onClick={() => setOpen(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"><span className="text-lg">+</span> Nouvelle vente</button>
        </div>
      </div>

      {/* Filters: history quick buttons + search by date/product */}
      <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-gray-900">Historique :</span>
          <button className={`px-3 py-1.5 rounded-md font-medium ${filterPeriod === 'daily' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`} onClick={() => { setFilterPeriod('daily'); fetchVentes({ period: 'daily', productId: filterProductId }); }}>Aujourd'hui</button>
          <button className={`px-3 py-1.5 rounded-md font-medium ${filterPeriod === 'weekly' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`} onClick={() => { setFilterPeriod('weekly'); fetchVentes({ period: 'weekly', productId: filterProductId }); }}>Cette semaine</button>
          <button className={`px-3 py-1.5 rounded-md font-medium ${filterPeriod === 'monthly' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`} onClick={() => { setFilterPeriod('monthly'); fetchVentes({ period: 'monthly', productId: filterProductId }); }}>Ce mois</button>
          <button className={`px-3 py-1.5 rounded-md font-medium ${filterPeriod === 'all' ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} ml-2`} onClick={() => { setFilterPeriod('all'); setFilterStartDate(null); setFilterEndDate(null); setFilterProductId(null); fetchVentes(); }}>Tout</button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-800">Du</label>
            <input type="date" value={filterStartDate ?? ''} onChange={(e) => setFilterStartDate(e.target.value || null)} className="px-3 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-800">Au</label>
            <input type="date" value={filterEndDate ?? ''} onChange={(e) => setFilterEndDate(e.target.value || null)} className="px-3 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-800">Produit</label>
            <select value={filterProductId ?? ''} onChange={(e) => setFilterProductId(e.target.value ? Number(e.target.value) : null)} className="px-3 py-1.5 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">-- Tous --</option>
              {produits.map((p) => (
                <option key={p.id} value={p.id}>{p.nom}</option>
              ))}
            </select>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => fetchVentes({ period: filterPeriod !== 'all' ? filterPeriod : undefined, startDate: filterStartDate, endDate: filterEndDate, productId: filterProductId })} className="px-4 py-1.5 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700">Rechercher</button>
            <button onClick={() => { setFilterPeriod('all'); setFilterStartDate(null); setFilterEndDate(null); setFilterProductId(null); fetchVentes(); }} className="px-4 py-1.5 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200">Réinitialiser</button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm bg-blue-50 p-3 rounded-md">
            <span className="font-medium text-gray-900">{ventesSummary.count}</span> vente(s) — Total: <span className="font-medium text-blue-700">{ventesSummary.sum.toFixed(2)} FC</span>
          </div>

          {/* Top Products Section */}
          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Produits les plus vendus</h3>
            <div className="space-y-2">
              {topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{product.nom}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      Quantité: <span className="font-medium text-gray-900">{product.quantite}</span>
                    </span>
                    <span className="text-sm text-gray-600">
                      Total: <span className="font-medium text-blue-700">{product.total.toFixed(2)} FC</span>
                    </span>
                  </div>
                </div>
              ))}
              {topProducts.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-4">
                  Aucune donnée disponible
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="text-left p-4 font-medium">#</th>
              <th className="text-left p-4 font-medium">Date</th>
              <th className="text-left p-4 font-medium">Produits</th>
              <th className="text-left p-4 font-medium">Total</th>
              <th className="text-left p-4 font-medium">Ticket</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {ventes.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-medium text-gray-900">{v.id}</td>
                  <td className="p-4 text-gray-700">{v.date_vente ? new Date(v.date_vente).toLocaleString() : ""}</td>
                  <td className="p-4">
                    {v.details && v.details.length > 0 ? (
                      <ul className="text-sm text-gray-700 space-y-1">
                        {v.details.map((d) => (
                          <li key={d.id} className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{d.medicament?.nom ?? 'Produit #' + (d.medicament?.id ?? '')}</span>
                            <span className="text-gray-600">× {d.quantite}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="p-4 text-gray-900">{v.total !== null ? Number(v.total).toFixed(2) + ' FC' : '-'}</td>
                  <td className="p-4"><a className="text-blue-600" href={`/api/exports/vente/${v.id}`}>PDF</a></td>
              </tr>
            ))}
            {ventes.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">Aucune vente trouvée</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-2xl mx-4">
            <div className="bg-white rounded-xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <h3 className="text-xl font-semibold text-gray-900">Nouvelle vente</h3>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors" onClick={() => setOpen(false)}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <form onSubmit={submit} className="space-y-4">
                {items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-7">
                      <label className="block text-sm text-gray-700 mb-1">Produit</label>
                      <select
                        value={it.medicament_id ?? ""}
                        onChange={(e) => updateItem(idx, { medicament_id: e.target.value ? Number(e.target.value) : null })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">-- Choisir --</option>
                        {produits.map((p) => (
                          <option key={p.id} value={p.id}>{p.nom} — {Number(p.prix_unitaire || 0).toFixed(2)} FC — stock {p.quantite_stock}</option>
                        ))}
                      </select>
                      {/* helper: show price & stock for selected product */}
                      {it.medicament_id && (
                        (() => {
                          const prod = produits.find((x) => x.id === Number(it.medicament_id));
                          if (!prod) return null;
                          return (
                            <div className="mt-1 text-xs text-gray-600">
                              Prix: <span className="font-medium text-gray-900">{Number(prod.prix_unitaire).toFixed(2)} FC</span>
                              <span className="mx-2">·</span>
                              Stock: <span className={`font-medium ${prod.quantite_stock > 10 ? 'text-green-700' : prod.quantite_stock > 0 ? 'text-yellow-700' : 'text-red-700'}`}>{prod.quantite_stock}</span>
                            </div>
                          );
                        })()
                      )}
                    </div>
                    <div className="col-span-3">
                      <label className="block text-sm text-gray-700 mb-1">Quantité</label>
                      <input
                        type="number"
                        value={it.quantite ?? ""}
                        onChange={(e) => updateItem(idx, { quantite: e.target.value ? Number(e.target.value) : null })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-2 flex items-end">
                      <button type="button" onClick={() => removeRow(idx)} className="px-3 py-2 text-sm text-red-600">Supprimer</button>
                    </div>
                  </div>
                ))}

                <div>
                  <button type="button" onClick={addRow} className="px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded">Ajouter une ligne</button>
                </div>

                {error && <div className="text-sm text-red-600">{error}</div>}

                <div className="pt-2 text-right">
                  <div className="text-sm text-gray-600">Total estimé: <span className="font-medium text-gray-900">{estimatedTotal.toFixed(2)} FC</span></div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">Annuler</button>
                  <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-lg">{loading ? 'Enregistrement...' : 'Enregistrer la vente'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
