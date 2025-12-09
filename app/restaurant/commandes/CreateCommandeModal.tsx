"use client";

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useTauxChange } from "@/lib/hooks/useTauxChange";

type Plat = { id: number; nom: string; prix?: number | string; disponible?: boolean };
type Boisson = { 
  id: number; 
  nom: string; 
  prix_vente?: number | string; 
  prix_verre?: number | string | null;
  stock?: number;
  vente_en_bouteille?: boolean;
  vente_en_verre?: boolean;
};
type Table = { id: number; numero: string; capacite: number; statut: string };
type Serveur = { id: number; nom: string; email: string };
type CaissierUser = { id: number; nom?: string | null; email?: string | null; role?: string | null };

export default function CreateCommandeModal({
  open,
  onCloseAction,
  onCreatedAction,
  currentUser,
}: {
  open: boolean;
  onCloseAction?: () => void;
  onCreatedAction?: (cmd?: any) => void;
  currentUser?: CaissierUser | null;
}) {
  const [plats, setPlats] = useState<Plat[]>([]);
  const [boissons, setBoissons] = useState<Boisson[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [serveurs, setServeurs] = useState<Serveur[]>([]);
  const [table, setTable] = useState("");
  const [serveurId, setServeurId] = useState<number | "">("");
  const [items, setItems] = useState<{ repas_id: number; quantite: number }[]>([]);
  const [itemsBoissons, setItemsBoissons] = useState<{ boisson_id: number; quantite: number; type_vente?: "BOUTEILLE" | "VERRE" }[]>([]);
  const [activeTab, setActiveTab] = useState<"plats" | "boissons">("plats");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const { tauxChange } = useTauxChange();
  const [boissonSelectionnee, setBoissonSelectionnee] = useState<{ boisson: Boisson; type_vente: "BOUTEILLE" | "VERRE" } | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setItems([]);
      setItemsBoissons([]);
      setTable("");
      setServeurId("");
      setActiveTab("plats");
      setError(null);
      return;
    }
    (async () => {
      try {
        const [repasRes, boissonsRes, tablesRes, serveursRes] = await Promise.all([
          fetch("/api/restaurant/repas"),
          fetch("/api/bar/boissons"),
          fetch("/api/restaurant/tables"),
          fetch("/api/restaurant/serveurs"),
        ]);
        const repasData = await repasRes.json();
        const boissonsData = await boissonsRes.json();
        const tablesData = await tablesRes.json();
        const serveursData = await serveursRes.json();
        setPlats(repasData || []);
        setBoissons(boissonsData || []);
        setTables(tablesData || []);
        setServeurs(serveursData || []);
      } catch (err) {
        setPlats([]);
        setBoissons([]);
        setTables([]);
        setServeurs([]);
      }
    })();
  }, [open]);

  const addItem = (repas_id: number) => {
    setItems((prev) => {
      const ex = prev.find((i) => i.repas_id === repas_id);
      if (ex) return prev.map((i) => (i.repas_id === repas_id ? { ...i, quantite: i.quantite + 1 } : i));
      return [...prev, { repas_id, quantite: 1 }];
    });
  };

  const updateQty = (repas_id: number, qty: number) => {
    if (qty <= 0) {
      removeItem(repas_id);
      return;
    }
    setItems((s) => s.map((it) => (it.repas_id === repas_id ? { ...it, quantite: qty } : it)));
  };

  const removeItem = (repas_id: number) => setItems((s) => s.filter((i) => i.repas_id !== repas_id));

  const addBoisson = (boisson_id: number) => {
    const boisson = boissons.find((b) => b.id === boisson_id);
    if (!boisson) return;

    // Si la boisson peut être vendue en bouteille ET en verre, demander le choix
    if (boisson.vente_en_bouteille && boisson.vente_en_verre) {
      setBoissonSelectionnee({ boisson, type_vente: "BOUTEILLE" }); // Par défaut bouteille
      return;
    }

    // Sinon, utiliser le type par défaut
    const typeVente = boisson.vente_en_bouteille ? "BOUTEILLE" : "VERRE";
    setItemsBoissons((prev) => {
      const ex = prev.find((i) => i.boisson_id === boisson_id && i.type_vente === typeVente);
      if (ex) return prev.map((i) => (i.boisson_id === boisson_id && i.type_vente === typeVente ? { ...i, quantite: i.quantite + 1 } : i));
      return [...prev, { boisson_id, quantite: 1, type_vente: typeVente as "BOUTEILLE" | "VERRE" }];
    });
  };

  const confirmerAjoutBoisson = () => {
    if (!boissonSelectionnee) return;
    const { boisson, type_vente } = boissonSelectionnee;
    setItemsBoissons((prev) => {
      const ex = prev.find((i) => i.boisson_id === boisson.id && i.type_vente === type_vente);
      if (ex) return prev.map((i) => (i.boisson_id === boisson.id && i.type_vente === type_vente ? { ...i, quantite: i.quantite + 1 } : i));
      return [...prev, { boisson_id: boisson.id, quantite: 1, type_vente }];
    });
    setBoissonSelectionnee(null);
  };

  const updateQtyBoisson = (boisson_id: number, qty: number, type_vente?: "BOUTEILLE" | "VERRE") => {
    if (qty <= 0) {
      removeBoisson(boisson_id, type_vente);
      return;
    }
    if (type_vente) {
      setItemsBoissons((s) => s.map((it) => 
        (it.boisson_id === boisson_id && it.type_vente === type_vente) 
          ? { ...it, quantite: qty } 
          : it
      ));
    } else {
      // Si pas de type_vente spécifié, mettre à jour le premier trouvé
      setItemsBoissons((s) => {
        const first = s.find((it) => it.boisson_id === boisson_id);
        if (first) {
          return s.map((it) => 
            (it.boisson_id === boisson_id && it.type_vente === first.type_vente) 
              ? { ...it, quantite: qty } 
              : it
          );
        }
        return s;
      });
    }
    setItemsBoissons((s) => s.map((it) => (it.boisson_id === boisson_id ? { ...it, quantite: qty } : it)));
  };

  const removeBoisson = (boisson_id: number, type_vente?: "BOUTEILLE" | "VERRE") => {
    if (type_vente) {
      setItemsBoissons((s) => s.filter((i) => !(i.boisson_id === boisson_id && i.type_vente === type_vente)));
    } else {
      // Si pas de type_vente spécifié, supprimer le premier trouvé
      setItemsBoissons((s) => {
        const first = s.find((it) => it.boisson_id === boisson_id);
        if (first) {
          return s.filter((i) => !(i.boisson_id === boisson_id && i.type_vente === first.type_vente));
        }
        return s.filter((i) => i.boisson_id !== boisson_id);
      });
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (items.length === 0 && itemsBoissons.length === 0) return setError("Ajoutez au moins un plat ou une boisson");
    // Plus besoin de vérifier la table, elle sera générée automatiquement
    if (!currentUser?.id) return setError("Impossible d'identifier le caissier connecté");
    setLoading(true);
    try {
      const res = await fetch("/api/restaurant/commandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          // table_numero sera généré automatiquement côté serveur 
          items,
          items_boissons: itemsBoissons.length > 0 ? itemsBoissons : undefined,
          serveur_id: serveurId || undefined,
          caissier_id: currentUser?.id,
        }),
      });
      
      // Vérifier le Content-Type avant de parser le JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(text || `Erreur ${res.status}: ${res.statusText}`);
      }
      
      // Vérifier que la réponse a du contenu
      const text = await res.text();
      if (!text || text.trim() === "") {
        throw new Error(`Erreur ${res.status}: Réponse vide du serveur`);
      }
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("Erreur de parsing JSON:", parseError, "Texte reçu:", text);
        throw new Error("Réponse invalide du serveur (JSON invalide)");
      }
      
      if (!res.ok) {
        const errorMessage = data?.error || (typeof data === "object" && data !== null ? JSON.stringify(data) : "Erreur lors de la création");
        throw new Error(errorMessage);
      }
      
      // Afficher un message de succès avec SweetAlert
      await Swal.fire({
        title: "Commande créée !",
        text: `La commande #${data?.id || ""} a été créée avec succès.`,
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#10b981",
      });
      
      onCreatedAction?.(data);
      setTable("");
      setItems([]);
      setItemsBoissons([]);
      setQuery("");
      setServeurId("");
      setActiveTab("plats");
      onCloseAction?.();
    } catch (err: any) {
      console.error("Erreur lors de la création de la commande:", err);
      await Swal.fire({
        title: "Erreur",
        text: err?.message || "Erreur lors de la création de la commande",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#ef4444",
      });
      setError(err?.message || "Erreur lors de la création de la commande");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const filteredPlats = plats.filter((p) => p.nom.toLowerCase().includes(query.toLowerCase()) && (p.disponible !== false));
  const filteredBoissons = boissons.filter((b) => b.nom.toLowerCase().includes(query.toLowerCase()) && (b.stock !== undefined ? Number(b.stock) > 0 : true));
  const filtered = activeTab === "plats" ? filteredPlats : filteredBoissons;
  
  const selectedDetails = items.map((it) => ({ ...it, plat: plats.find((p) => p.id === it.repas_id) })).filter(s => s.plat);
  const selectedBoissons = itemsBoissons.map((it) => ({ 
    ...it, 
    boisson: boissons.find((b) => b.id === it.boisson_id) 
  })).filter(s => s.boisson);

  const sousTotalPlats = selectedDetails.reduce((acc, s) => acc + (s.plat ? Number(s.plat.prix || 0) * s.quantite : 0), 0);
  const sousTotalBoissons = selectedBoissons.reduce((acc, s) => {
    if (!s.boisson) return acc;
    const prix = s.type_vente === "VERRE" && s.boisson.prix_verre 
      ? Number(s.boisson.prix_verre) 
      : Number(s.boisson.prix_vente || 0);
    return acc + prix * s.quantite;
  }, 0);
  const sousTotal = sousTotalPlats + sousTotalBoissons;
  const total = sousTotal;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onCloseAction?.()} />
      
      {/* Modal */}
      <div className="relative z-10 w-full sm:max-w-6xl bg-white rounded-none sm:rounded-xl shadow-2xl overflow-hidden min-h-screen sm:min-h-0 sm:max-h-[90vh] flex flex-col my-0 sm:my-auto">
        {/* En-tête du modal */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Nouvelle commande</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 hidden sm:block">Sélectionnez les plats et spécifiez la quantité</p>
          </div>
          <button 
            onClick={() => onCloseAction?.()} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 ml-2"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Panneau gauche - Liste des plats et boissons */}
          <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto border-b lg:border-b-0 lg:border-r border-gray-200">
            {/* Onglets Plats / Boissons */}
            <div className="mb-4 sm:mb-6 flex gap-2 border-b border-gray-200">
              <button
                type="button"
                onClick={() => { setActiveTab("plats"); setQuery(""); }}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "plats"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Plats
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("boissons"); setQuery(""); }}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "boissons"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Boissons
              </button>
            </div>

            {/* Barre de recherche */}
            <div className="mb-4 sm:mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </div>
                <input 
                  type="text"
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)} 
                  className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                  placeholder={activeTab === "plats" ? "Rechercher un plat..." : "Rechercher une boisson..."}
                />
              </div>
            </div>

            {/* Liste des plats ou boissons */}
            <div className="space-y-2 sm:space-y-3">
              {activeTab === "plats" ? (
                filteredPlats.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="text-sm sm:text-base text-gray-500">Aucun plat disponible</div>
                  </div>
                ) : (
                  filteredPlats.map((p) => {
                    const quantiteAjoutee = items.find(i => i.repas_id === p.id)?.quantite ?? 0;
                    return (
                      <div 
                        key={p.id} 
                        className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm sm:text-base text-gray-900 truncate">{p.nom}</div>
                            <div className="text-xs sm:text-sm text-gray-600 mt-1">{(Number(p.prix ?? 0) / tauxChange).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $</div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            {quantiteAjoutee > 0 && (
                              <div className="px-2 sm:px-2.5 py-1 bg-blue-50 text-blue-700 text-xs sm:text-sm font-medium rounded">
                                {quantiteAjoutee} ×
                              </div>
                            )}
                            <button 
                              type="button" 
                              onClick={() => addItem(p.id)} 
                              className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                            >
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                              </svg>
                              <span className="hidden sm:inline">Ajouter</span>
                              <span className="sm:hidden">+</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                filteredBoissons.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="text-sm sm:text-base text-gray-500">Aucune boisson disponible</div>
                  </div>
                ) : (
                  filteredBoissons.map((b) => {
                    const quantiteAjoutee = itemsBoissons.filter(i => i.boisson_id === b.id).reduce((sum, i) => sum + i.quantite, 0);
                    const prixBouteille = (Number(b.prix_vente ?? 0) / tauxChange).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    const prixVerre = b.prix_verre ? (Number(b.prix_verre) / tauxChange).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : null;
                    const peutVendreBouteille = b.vente_en_bouteille ?? true;
                    const peutVendreVerre = b.vente_en_verre ?? false;
                    
                    return (
                      <div 
                        key={b.id} 
                        className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm sm:text-base text-gray-900 truncate">{b.nom}</div>
                            <div className="text-xs sm:text-sm text-gray-600 mt-1">
                              {peutVendreBouteille && (
                                <span>Bouteille: {prixBouteille} $</span>
                              )}
                              {peutVendreBouteille && peutVendreVerre && <span className="mx-1">•</span>}
                              {peutVendreVerre && prixVerre && (
                                <span>Verre: {prixVerre} $</span>
                              )}
                              {!peutVendreBouteille && !peutVendreVerre && (
                                <span>{prixBouteille} $</span>
                              )}
                              {b.stock !== undefined && (
                                <span className="ml-2 text-gray-500">• Stock: {Number(b.stock).toFixed(2)}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            {quantiteAjoutee > 0 && (
                              <div className="px-2 sm:px-2.5 py-1 bg-green-50 text-green-700 text-xs sm:text-sm font-medium rounded">
                                {quantiteAjoutee} ×
                              </div>
                            )}
                            <button 
                              type="button" 
                              onClick={() => addBoisson(b.id)} 
                              disabled={b.stock !== undefined && Number(b.stock) <= 0}
                              className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                            >
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                              </svg>
                              <span className="hidden sm:inline">Ajouter</span>
                              <span className="sm:hidden">+</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )
              )}
            </div>
          </div>

          {/* Panneau droit - Détails de la commande */}
          <div className="w-full lg:w-[400px] bg-gray-50 flex flex-col">
            <div className="p-3 sm:p-4 lg:p-6 flex-1 overflow-y-auto">
              <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">Détails de la commande</h4>
              
              {/* Info table automatique */}
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                <label className="block text-xs sm:text-sm font-bold text-green-900 mb-2 sm:mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span className="truncate">Table assignée automatiquement</span>
                </label>
                <div className="p-2 sm:p-3 bg-white border border-green-200 rounded-lg">
                  <div className="text-xs sm:text-sm text-green-800 font-medium">
                    Une nouvelle table sera automatiquement créée pour cette commande
                  </div>
                  <div className="text-xs text-green-700 mt-1">
                    La table sera numérotée selon l'ordre de création (Commande 1 = Table 1, Commande 2 = Table 2, etc.)
                  </div>
                </div>
              </div>

              {/* Champ sélection du serveur */}
              {serveurs.length > 0 && (
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                  <label className="block text-xs sm:text-sm font-bold text-green-900 mb-2 sm:mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                    <span className="truncate">Serveur <span className="text-red-500">*</span></span>
                  </label>
                  <div className="relative">
                    <select
                      value={serveurId} 
                      onChange={(e) => setServeurId(e.target.value ? Number(e.target.value) : "")} 
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 pr-10 sm:pr-12 border-2 border-green-400 rounded-lg text-sm sm:text-base font-semibold text-gray-900 focus:ring-2 sm:focus:ring-4 focus:ring-green-300 focus:border-green-600 outline-none transition-all bg-white appearance-none cursor-pointer hover:border-green-500 shadow-sm" 
                      required
                    >
                      <option value="" className="text-gray-500 font-normal">Sélectionnez un serveur</option>
                      {serveurs.map((s) => (
                        <option key={s.id} value={s.id} className="text-gray-900 font-medium">
                          {s.nom}{s.email ? ` (${s.email})` : ""}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 sm:pr-4 pointer-events-none">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/>
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Caissier connecté (assigné automatiquement) */}
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-purple-50 border-2 border-purple-200 rounded-xl">
                <label className="block text-xs sm:text-sm font-bold text-purple-900 mb-2 sm:mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                  </svg>
                  <span className="truncate">Caissier connecté</span>
                </label>
                {currentUser?.id ? (
                  <div className="rounded-lg bg-white border border-purple-100 px-4 py-3">
                    <div className="text-sm font-semibold text-gray-900">
                      {currentUser?.nom || currentUser?.email || "Utilisateur connecté"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Assigné automatiquement à la commande.
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700">
                    Impossible d'identifier l'utilisateur connecté. Réessayez après reconnexion.
                  </div>
                )}
              </div>

              {/* Liste des plats et boissons ajoutés */}
              {selectedDetails.length === 0 && selectedBoissons.length === 0 ? (
                <div className="py-6 sm:py-8 text-center">
                  <div className="text-xs sm:text-sm text-gray-500">Aucun article ajouté</div>
                  <div className="text-xs text-gray-400 mt-1 hidden sm:block">Ajoutez des plats ou des boissons depuis le menu</div>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {/* Plats */}
                  {selectedDetails.map((s) => (
                    <div key={`plat-${s.repas_id}`} className="bg-white rounded-lg border border-gray-200 p-2.5 sm:p-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="font-medium text-xs sm:text-sm text-gray-900 flex-1 min-w-0 truncate">
                          <span className="text-blue-600 font-semibold">🍽️</span> {s.plat?.nom}
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">
                          {(Number(s.plat?.prix || 0) / tauxChange).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                          <button 
                            type="button" 
                            onClick={() => updateQty(s.repas_id, s.quantite - 1)}
                            className="px-2 sm:px-2.5 py-1 sm:py-1.5 hover:bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium transition-colors"
                          >
                            −
                          </button>
                          <div className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-900 min-w-[2rem] text-center">{s.quantite}</div>
                          <button 
                            type="button" 
                            onClick={() => updateQty(s.repas_id, s.quantite + 1)}
                            className="px-2 sm:px-2.5 py-1 sm:py-1.5 hover:bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeItem(s.repas_id)}
                          className="p-1 sm:p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors flex-shrink-0"
                          aria-label="Supprimer"
                        >
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* Boissons */}
                  {selectedBoissons.map((s, idx) => {
                    const prix = s.type_vente === "VERRE" && s.boisson?.prix_verre 
                      ? Number(s.boisson.prix_verre) 
                      : Number(s.boisson?.prix_vente || 0);
                    const typeLabel = s.type_vente === "VERRE" ? "Verre" : "Bouteille";
                    return (
                      <div key={`boisson-${s.boisson_id}-${s.type_vente}-${idx}`} className="bg-white rounded-lg border border-green-200 p-2.5 sm:p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="font-medium text-xs sm:text-sm text-gray-900 flex-1 min-w-0">
                            <div className="truncate">
                              <span className="text-green-600 font-semibold">🥤</span> {s.boisson?.nom}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {typeLabel}
                            </div>
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">
                            {(prix / tauxChange).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                            <button 
                              type="button" 
                              onClick={() => updateQtyBoisson(s.boisson_id, s.quantite - 1, s.type_vente)}
                              className="px-2 sm:px-2.5 py-1 sm:py-1.5 hover:bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium transition-colors"
                            >
                              −
                            </button>
                            <div className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-900 min-w-[2rem] text-center">{s.quantite}</div>
                            <button 
                              type="button" 
                              onClick={() => updateQtyBoisson(s.boisson_id, s.quantite + 1, s.type_vente)}
                              className="px-2 sm:px-2.5 py-1 sm:py-1.5 hover:bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium transition-colors"
                            >
                              +
                            </button>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => removeBoisson(s.boisson_id, s.type_vente)}
                            className="p-1 sm:p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors flex-shrink-0"
                            aria-label="Supprimer"
                          >
                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer avec total et boutons */}
            <div className="border-t border-gray-200 bg-white sticky bottom-0">
              {(selectedDetails.length > 0 || selectedBoissons.length > 0) && (
                <div className="p-3 sm:p-4 border-b border-gray-200">
                  {selectedDetails.length > 0 && (
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      <div className="text-xs sm:text-sm text-gray-600">Sous-total plats</div>
                      <div className="text-xs sm:text-sm font-medium text-gray-900">{(sousTotalPlats / tauxChange).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $</div>
                    </div>
                  )}
                  {selectedBoissons.length > 0 && (
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      <div className="text-xs sm:text-sm text-gray-600">Sous-total boissons</div>
                      <div className="text-xs sm:text-sm font-medium text-gray-900">{(sousTotalBoissons / tauxChange).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $</div>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 mt-2">
                    <div className="text-sm sm:text-base font-semibold text-gray-900">Total</div>
                    <div className="text-sm sm:text-base font-bold text-gray-900">{(total / tauxChange).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $</div>
                  </div>
                </div>
              )}

              {error && (
                <div className="px-3 sm:px-4 py-2 sm:py-3 bg-red-50 border-b border-red-100">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span className="break-words">{error}</span>
                  </div>
                </div>
              )}

              <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
                <button 
                  type="button" 
                  onClick={() => onCloseAction?.()} 
                  className="px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={loading || (selectedDetails.length === 0 && selectedBoissons.length === 0)} 
                  className={`
                    px-4 py-2.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors
                    ${loading || (selectedDetails.length === 0 && selectedBoissons.length === 0)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'}
                  `}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      <span className="hidden sm:inline">Création...</span>
                      <span className="sm:hidden">...</span>
                    </span>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Créer la commande</span>
                      <span className="sm:hidden">Créer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Modal de sélection bouteille/verre */}
      {boissonSelectionnee && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Choisir le type de vente
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {boissonSelectionnee.boisson.nom}
            </p>
            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={() => setBoissonSelectionnee({ ...boissonSelectionnee, type_vente: "BOUTEILLE" })}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  boissonSelectionnee.type_vente === "BOUTEILLE"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">Bouteille</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {(Number(boissonSelectionnee.boisson.prix_vente || 0) / tauxChange).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $
                    </div>
                  </div>
                  {boissonSelectionnee.type_vente === "BOUTEILLE" && (
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                    </svg>
                  )}
                </div>
              </button>
              <button
                type="button"
                onClick={() => setBoissonSelectionnee({ ...boissonSelectionnee, type_vente: "VERRE" })}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  boissonSelectionnee.type_vente === "VERRE"
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">Verre/Mesure</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {boissonSelectionnee.boisson.prix_verre 
                        ? `${(Number(boissonSelectionnee.boisson.prix_verre) / tauxChange).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $`
                        : "Prix non défini"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">1 bouteille = 10 verres</div>
                  </div>
                  {boissonSelectionnee.type_vente === "VERRE" && (
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                    </svg>
                  )}
                </div>
              </button>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setBoissonSelectionnee(null)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmerAjoutBoisson}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

