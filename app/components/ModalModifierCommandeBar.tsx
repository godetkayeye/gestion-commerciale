"use client";

import { useState, useEffect } from "react";

interface ModalModifierCommandeBarProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  commande: any;
}

export default function ModalModifierCommandeBar({ isOpen, onClose, onSuccess, commande }: ModalModifierCommandeBarProps) {
  const [tables, setTables] = useState<any[]>([]);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [boissons, setBoissons] = useState<any[]>([]);
  const [form, setForm] = useState({ table_id: "", serveur_id: "", status: "", items: [] as any[] });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && commande) {
      (async () => {
        try {
          setError(null);
          // Charger uniquement les données nécessaires pour les listes déroulantes
          const [tablesRes, personnelRes, boissonsRes] = await Promise.all([
            fetch("/api/bar/tables"),
            fetch("/api/bar/personnel"),
            fetch("/api/bar/boissons"),
          ]);
          
          // Vérifier que les réponses sont OK
          if (!tablesRes.ok) {
            throw new Error("Erreur lors du chargement des tables");
          }
          if (!personnelRes.ok) {
            throw new Error("Erreur lors du chargement du personnel");
          }
          if (!boissonsRes.ok) {
            throw new Error("Erreur lors du chargement des boissons");
          }

          const tablesData = await tablesRes.json();
          const personnelData = await personnelRes.json();
          const boissonsData = await boissonsRes.json();

          setTables(tablesData);
          setPersonnel(personnelData);
          setBoissons(boissonsData);
          
          // Utiliser directement les données de la commande passée en props
          setForm({
            table_id: commande.table_id ? String(commande.table_id) : "",
            serveur_id: commande.serveur_id ? String(commande.serveur_id) : "",
            status: commande.status ? String(commande.status) : "EN_COURS",
            items: commande.details?.map((d: any) => ({
              boisson_id: d.boisson_id,
              quantite: d.quantite,
              boisson_nom: d.boisson?.nom,
            })) || [],
          });
        } catch (err: any) {
          console.error("Erreur lors du chargement:", err);
          setError(err.message || "Erreur lors du chargement des données");
          // Utiliser les données de la commande passée en props si le chargement échoue
          setForm({
            table_id: commande.table_id ? String(commande.table_id) : "",
            serveur_id: commande.serveur_id ? String(commande.serveur_id) : "",
            status: commande.status ? String(commande.status) : "EN_COURS",
            items: commande.details?.map((d: any) => ({
              boisson_id: d.boisson_id,
              quantite: d.quantite,
              boisson_nom: d.boisson?.nom,
            })) || [],
          });
        }
      })();
    }
  }, [isOpen, commande]);

  if (!isOpen || !commande) return null;

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { boisson_id: "", quantite: 1 }] });
  };

  const removeItem = (idx: number) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const newItems = [...form.items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    setForm({ ...form, items: newItems });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Vérifier que la commande a un ID valide
      if (!commande || !commande.id) {
        setError("Commande invalide : ID manquant");
        setLoading(false);
        return;
      }

      const commandeId = Number(commande.id);
      if (isNaN(commandeId) || commandeId <= 0) {
        setError("Commande invalide : ID incorrect");
        setLoading(false);
        return;
      }
      
      // Préparer le body de la requête
      const body: any = {};
      
      // Inclure table_id et serveur_id si modifiés
      const originalTableId = commande.table_id ? String(commande.table_id) : "";
      const originalServeurId = commande.serveur_id ? String(commande.serveur_id) : "";
      
      if (form.table_id !== originalTableId) {
        body.table_id = form.table_id ? Number(form.table_id) : null;
      }
      if (form.serveur_id !== originalServeurId) {
        body.serveur_id = form.serveur_id ? Number(form.serveur_id) : null;
      }
      
      // Si le statut est modifié, l'inclure
      if (form.status && form.status !== commande.status) {
        body.status = form.status;
      }
      
      // Comparer les items pour voir s'ils ont changé
      const originalItems = (commande.details || []).map((d: any) => ({
        boisson_id: d.boisson_id,
        quantite: d.quantite,
      })).sort((a: any, b: any) => a.boisson_id - b.boisson_id);
      
      const newItems = form.items
        .filter((it) => it.boisson_id && it.boisson_id !== "")
        .map((it) => ({
          boisson_id: Number(it.boisson_id),
          quantite: Number(it.quantite),
        }))
        .sort((a, b) => a.boisson_id - b.boisson_id);
      
      // Vérifier si les items ont changé (comparaison simple)
      const itemsChanged = 
        originalItems.length !== newItems.length ||
        originalItems.some((orig: any, idx: number) => {
          const newItem = newItems[idx];
          return !newItem || orig.boisson_id !== newItem.boisson_id || orig.quantite !== newItem.quantite;
        }) ||
        newItems.some((newItem, idx) => {
          const orig = originalItems[idx];
          return !orig || orig.boisson_id !== newItem.boisson_id || orig.quantite !== newItem.quantite;
        });
      
      // Si les items ont changé et que la commande n'est pas validée, les inclure
      if (itemsChanged && commande.status !== "VALIDEE") {
        if (newItems.length === 0) {
          setError("Une commande doit avoir au moins un article");
          setLoading(false);
          return;
        }
        body.items = newItems;
      }
      
      // Vérifier qu'au moins une modification est présente
      if (Object.keys(body).length === 0) {
        setError("Aucune modification détectée");
        setLoading(false);
        return;
      }
      
      const res = await fetch(`/api/bar/commandes/${commandeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMessage = typeof data.error === 'string' 
          ? data.error 
          : data.error?.message || JSON.stringify(data.error) || "Erreur lors de la modification";
        setError(errorMessage);
        setLoading(false);
        return;
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Erreur lors de la modification:", err);
      setError(err.message || "Erreur lors de la modification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Modifier la commande #{commande.id}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-light">&times;</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-2 font-semibold text-gray-900">Table</label>
              <select
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                value={form.table_id}
                onChange={(e) => setForm({ ...form, table_id: e.target.value })}
              >
                <option value="">Aucune table</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>{t.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2 font-semibold text-gray-900">Serveur</label>
              <select
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                value={form.serveur_id}
                onChange={(e) => setForm({ ...form, serveur_id: e.target.value })}
              >
                <option value="">Aucun serveur</option>
                {personnel.map((p) => (
                  <option key={p.id} value={p.id}>{p.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-2 font-semibold text-gray-900">Statut</label>
              <select
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="EN_COURS">En cours</option>
                <option value="VALIDEE">Validée</option>
                <option value="ANNULEE">Annulée</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-semibold text-gray-900">Articles</label>
              {commande.status !== "VALIDEE" && (
                <button type="button" onClick={addItem} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  + Ajouter un article
                </button>
              )}
              {commande.status === "VALIDEE" && (
                <span className="text-xs text-gray-500 italic">Les articles ne peuvent pas être modifiés pour une commande validée</span>
              )}
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {form.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center p-2 bg-gray-50 rounded">
                  <select
                    className={`flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none text-gray-900 ${commande.status === "VALIDEE" ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    value={item.boisson_id}
                    onChange={(e) => updateItem(idx, "boisson_id", e.target.value)}
                    required
                    disabled={commande.status === "VALIDEE"}
                  >
                    <option value="">Sélectionner une boisson</option>
                    {boissons.map((b) => (
                      <option key={b.id} value={b.id}>{b.nom} - {Number(b.prix_vente).toFixed(2)} FC</option>
                    ))}
                  </select>
                  <input
                    className={`w-20 border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none text-gray-900 ${commande.status === "VALIDEE" ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    type="number"
                    min="1"
                    value={item.quantite}
                    onChange={(e) => updateItem(idx, "quantite", Number(e.target.value))}
                    required
                    disabled={commande.status === "VALIDEE"}
                  />
                  {commande.status !== "VALIDEE" && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              ))}
              {form.items.length === 0 && (
                <div className="text-center py-4 text-sm text-gray-500">Aucun article. Cliquez sur "Ajouter un article" pour commencer.</div>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
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
              {loading ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

