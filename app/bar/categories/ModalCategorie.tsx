"use client";

import { useState, useEffect } from "react";
import Swal from "sweetalert2";

interface ModalCategorieProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item?: any;
}

export default function ModalCategorie({ isOpen, onClose, onSuccess, item }: ModalCategorieProps) {
  const [nom, setNom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setNom(item.nom ?? "");
    } else {
      setNom("");
    }
  }, [item, isOpen]);

  if (!isOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = item ? `/api/bar/categories/${item.id}` : "/api/bar/categories";
      const method = item ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: nom.trim() }),
      });

      let data = null;
      const contentType = res.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        const text = await res.text();
        if (text.trim() !== "") {
          try {
            data = JSON.parse(text);
          } catch (parseError) {
            console.error("Erreur de parsing JSON:", parseError, "Texte reçu:", text);
            throw new Error("Réponse invalide du serveur (JSON invalide)");
          }
        }
      } else {
        const text = await res.text();
        if (text.trim() !== "") {
          throw new Error(text || `Erreur ${res.status}: ${res.statusText}`);
        }
      }

      if (!res.ok) {
        const errorMessage = data?.error || (item ? "Erreur lors de la modification de la catégorie" : "Erreur lors de la création de la catégorie");
        const errorDetails = data?.details ? `\n\nDétails: ${typeof data.details === 'string' ? data.details : JSON.stringify(data.details)}` : "";
        throw new Error(errorMessage + errorDetails);
      }

      await Swal.fire({
        title: item ? "Catégorie modifiée !" : "Catégorie créée !",
        text: `La catégorie "${nom.trim()}" a été ${item ? "modifiée" : "créée"} avec succès.`,
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#10b981",
      });

      setNom("");
      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMessage = err.message || (item ? "Erreur lors de la modification de la catégorie" : "Erreur lors de la création de la catégorie");
      setError(errorMessage);
      await Swal.fire({
        title: "Erreur !",
        text: errorMessage,
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity"
      onClick={onClose}
      aria-hidden={!isOpen}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">{item ? "Modifier la catégorie" : "Nouvelle catégorie"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-light">&times;</button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm mb-2 font-semibold text-gray-900">Nom de la catégorie</label>
            <input
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-500 focus:outline-none text-gray-900"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Boissons alcoolisées, Cocktails, etc."
              required
            />
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
              {loading ? "Enregistrement..." : item ? "Modifier" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

