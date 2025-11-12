"use client";

import { useEffect, useState } from "react";

interface ModalNouvelleCommandeBarProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalNouvelleCommandeBar({ isOpen, onClose, onSuccess }: ModalNouvelleCommandeBarProps) {
  const [plats, setPlats] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [serveurs, setServeurs] = useState<any[]>([]);
  const [table_id, setTable] = useState("");
  const [serveur_id, setServeur] = useState("");
  const [items, setItems] = useState<{ boisson_id: number; quantite: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      (async () => {
        const [boissonsRes, tablesRes, serveursRes] = await Promise.all([
          fetch("/api/bar/boissons"),
          fetch("/api/bar/tables"),
          fetch("/api/bar/personnel"),
        ]);
        const boissons = await boissonsRes.json();
        const tablesData = await tablesRes.json().catch(() => []);
        const serveursData = await serveursRes.json().catch(() => []);
        setPlats(boissons);
        setTables(tablesData);
        setServeurs(serveursData);
      })();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const addItem = (boisson_id: number) => {
    setItems((prev) => {
      const ex = prev.find((i) => i.boisson_id === boisson_id);
      if (ex) return prev.map((i) => (i.boisson_id === boisson_id ? { ...i, quantite: i.quantite + 1 } : i));
      return [...prev, { boisson_id, quantite: 1 }];
    });
  };

  const removeItem = (boisson_id: number) => {
    setItems((prev) => prev.filter((i) => i.boisson_id !== boisson_id));
  };

  const updateQuantite = (boisson_id: number, quantite: number) => {
    if (quantite <= 0) {
      removeItem(boisson_id);
      return;
    }
    setItems((prev) => prev.map((i) => (i.boisson_id === boisson_id ? { ...i, quantite } : i)));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setError("Veuillez sélectionner au moins une boisson");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/bar/commandes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table_id: table_id ? Number(table_id) : null,
        serveur_id: serveur_id ? Number(serveur_id) : null,
        items,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ? JSON.stringify(data.error) : "Erreur");
      return;
    }
    setItems([]);
    setTable("");
    setServeur("");
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Nouvelle commande</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-light">&times;</button>
        </div>
        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {tables.length > 0 && (
              <div>
                <label className="block text-sm mb-2 font-semibold text-gray-900">Table</label>
                <select
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                  value={table_id}
                  onChange={(e) => setTable(e.target.value)}
                >
                  <option value="">Sélectionner une table</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>{t.nom}</option>
                  ))}
                </select>
              </div>
            )}
            {serveurs.length > 0 && (
              <div>
                <label className="block text-sm mb-2 font-semibold text-gray-900">Serveur</label>
                <select
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
                  value={serveur_id}
                  onChange={(e) => setServeur(e.target.value)}
                >
                  <option value="">Sélectionner un serveur</option>
                  {serveurs.map((s) => (
                    <option key={s.id} value={s.id}>{s.nom}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div>
            <div className="text-sm mb-3 font-semibold text-gray-900">Boissons disponibles</div>
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto border-2 border-gray-200 rounded-lg p-3 bg-gray-50">
              {plats.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addItem(p.id)}
                  className="border-2 border-gray-300 rounded-lg p-3 text-left hover:bg-blue-50 hover:border-blue-400 transition-colors bg-white"
                >
                  <div className="font-semibold text-gray-900">{p.nom}</div>
                  <div className="text-sm text-gray-700 mt-1">
                    <span className="font-medium text-blue-700">{Number(p.prix_vente).toFixed(2)} FC</span>
                    <span className="text-gray-500"> — Stock: </span>
                    <span className={`font-medium ${p.stock <= 5 ? "text-red-600" : "text-green-600"}`}>{p.stock}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm mb-3 font-semibold text-gray-900">Sélection</div>
            {items.length === 0 ? (
              <div className="text-sm text-gray-600 p-4 border-2 border-gray-200 rounded-lg bg-gray-50 text-center">
                Aucune boisson sélectionnée.
              </div>
            ) : (
              <div className="space-y-2 border-2 border-gray-200 rounded-lg p-3 bg-gray-50">
                {items.map((i) => {
                  const boisson = plats.find((p) => p.id === i.boisson_id);
                  const total = (Number(boisson?.prix_vente ?? 0) * i.quantite).toFixed(2);
                  return (
                    <div key={i.boisson_id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                      <div>
                        <div className="font-semibold text-gray-900">{boisson?.nom ?? "N/A"}</div>
                        <div className="text-sm text-gray-700">
                          <span className="font-medium text-blue-700">{Number(boisson?.prix_vente ?? 0).toFixed(2)} FC</span>
                          <span className="text-gray-500"> × </span>
                          <span className="font-medium">{i.quantite}</span>
                          <span className="text-gray-500"> = </span>
                          <span className="font-bold text-green-700">{total} FC</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantite(i.boisson_id, i.quantite - 1)}
                          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          -
                        </button>
                        <span className="w-10 text-center font-semibold text-gray-900">{i.quantite}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantite(i.boisson_id, i.quantite + 1)}
                          className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium transition-colors"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(i.boisson_id)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium ml-2 transition-colors"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          <div className="flex gap-3 justify-end pt-4 border-t">
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
              {loading ? "Création..." : "Créer la commande"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

