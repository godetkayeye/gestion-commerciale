"use client";

import React, { useState } from "react";
import Link from "next/link";

type Produit = {
  id: number;
  nom: string;
  prix_unitaire: number;
  quantite_stock: number;
  date_expiration: string | null;
};

type Props = {
  initial: Produit[];
  userRole?: string | null;
};

export default function ProductsClient({ initial, userRole }: Props) {
  const [produits, setProduits] = useState<Produit[]>(initial);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    nom: "",
    prix_unitaire: "",
    quantite_stock: "",
    date_expiration: "",
  });

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body = {
        nom: form.nom,
        prix_unitaire: Number(form.prix_unitaire),
        quantite_stock: Number(form.quantite_stock),
        date_expiration: form.date_expiration || null,
      };

      const res = await fetch("/api/pharmacie/medicaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json?.error?.message || JSON.stringify(json));
      }
      const created = await res.json();
      // Normaliser le format
      const newProduit: Produit = {
        id: created.id,
        nom: created.nom,
        prix_unitaire: Number(created.prix_unitaire),
        quantite_stock: Number(created.quantite_stock),
        date_expiration: created.date_expiration ? new Date(created.date_expiration).toISOString() : null,
      };
      setProduits((p) => [newProduit, ...p]);
      setOpen(false);
      setForm({ nom: "", prix_unitaire: "", quantite_stock: "", date_expiration: "" });
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800">Produits</h2>
        <div className="flex items-center gap-4">
          <Link 
            href="/pharmacie/ventes" 
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            Voir les ventes
          </Link>
          <button
            onClick={() => setOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <span className="text-lg">+</span>
            Ajouter un produit
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="text-left p-4 font-medium">Nom du produit</th>
              <th className="text-left p-4 font-medium">Prix unitaire</th>
              <th className="text-left p-4 font-medium">Stock</th>
              <th className="text-left p-4 font-medium">Date d'expiration</th>
              <th className="text-left p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {produits.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 font-medium text-gray-900">{p.nom}</td>
                <td className="p-4">
                  <span className="font-medium text-gray-900">{Number(p.prix_unitaire).toFixed(2)}</span>
                  <span className="text-gray-500 ml-1">FC</span>
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    p.quantite_stock > 10 
                      ? 'bg-green-100 text-green-800'
                      : p.quantite_stock > 0
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {p.quantite_stock} en stock
                  </span>
                </td>
                <td className="p-4 text-gray-500">
                  {p.date_expiration ? new Date(p.date_expiration).toLocaleDateString() : "Pas d'expiration"}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Link 
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors" 
                      href={`/pharmacie/produits/${p.id}`}
                    >
                      Modifier
                    </Link>
                    {userRole === "ADMIN" && (
                      <button
                        onClick={async () => {
                          console.log('Rôle utilisateur:', userRole); // Log du rôle
                          // Validation locale de l'id
                          if (!p || p.id === undefined || p.id === null) {
                            alert('Impossible de supprimer : id produit manquant');
                            console.error('[client] id manquant pour le produit', p);
                            return;
                          }

                          const idStr = String(p.id);
                          const url = `/api/pharmacie/medicaments/${encodeURIComponent(idStr)}`;
                          console.log('URL de suppression:', url);

                          if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
                            try {
                              console.log('Tentative de suppression du produit:', p.id);
                              const res = await fetch(url, {
                                method: 'DELETE',
                                headers: {
                                  'Accept': 'application/json',
                                },
                                credentials: 'include',
                              });

                              console.log('Statut de la réponse:', res.status);
                              const contentType = res.headers.get('content-type');
                              console.log('Type de contenu:', contentType);

                              const text = await res.text();
                              console.log('Réponse brute:', text);

                              if (!res.ok) {
                                let errorMessage;
                                try {
                                  const data = JSON.parse(text);
                                  errorMessage = data.error;
                                } catch (e) {
                                  errorMessage = text || 'Erreur de format de réponse';
                                }
                                throw new Error(errorMessage || 'Erreur lors de la suppression');
                              }

                              // Si la suppression a réussi
                              setProduits(produits.filter(prod => prod.id !== p.id));
                              alert('Produit supprimé avec succès');
                            } catch (error: any) {
                              console.error('Erreur détaillée:', error);
                              alert(error.message || 'Erreur lors de la suppression');
                            }
                          }
                        }}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {produits.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center">
                  <div className="text-gray-500 text-sm">Aucun produit trouvé</div>
                  <button 
                    onClick={() => setOpen(true)}
                    className="mt-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Ajouter votre premier produit
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-lg mx-4">
            <div className="bg-white rounded-xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <h3 className="text-xl font-semibold text-gray-900">Ajouter un produit</h3>
                <button 
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={submit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom du produit</label>
                  <input 
                    name="nom" 
                    value={form.nom} 
                    onChange={onChange} 
                    required 
                    className="block w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    placeholder="Entrez le nom du produit"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix unitaire (FC)</label>
                    <input 
                      name="prix_unitaire" 
                      value={form.prix_unitaire} 
                      onChange={onChange} 
                      required 
                      type="number" 
                      step="0.01" 
                      className="block w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantité en stock</label>
                    <input 
                      name="quantite_stock" 
                      value={form.quantite_stock} 
                      onChange={onChange} 
                      required 
                      type="number" 
                      className="block w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date d'expiration
                    <span className="text-gray-500 font-normal ml-1">(optionnelle)</span>
                  </label>
                  <input 
                    name="date_expiration" 
                    value={form.date_expiration} 
                    onChange={onChange} 
                    type="date" 
                    className="block w-full px-4 py-2.5 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setOpen(false)} 
                    className="px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 transition-colors disabled:opacity-50"
                  >
                    {loading ? "Enregistrement..." : "Ajouter le produit"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
