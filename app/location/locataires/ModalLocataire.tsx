"use client";

import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";

interface ModalLocataireProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingItem: any | null;
}

export default function ModalLocataire({ isOpen, onClose, onSuccess, editingItem }: ModalLocataireProps) {
  const [form, setForm] = useState({ nom: "", contact: "", profession: "", piece_identite: "" });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputClass =
    "w-full rounded-2xl border-[1.5px] border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition";
  const labelClass = "block text-sm font-semibold text-slate-800 mb-1.5";

  useEffect(() => {
    if (editingItem) {
      setForm({
        nom: editingItem.nom || "",
        contact: editingItem.contact || "",
        profession: editingItem.profession || "",
        piece_identite: editingItem.piece_identite || "",
      });
      setPreviewImage(editingItem.piece_identite || null);
    } else {
      setForm({ nom: "", contact: "", profession: "", piece_identite: "" });
      setPreviewImage(null);
    }
    setError(null);
  }, [editingItem, isOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type
    if (!file.type.startsWith("image/")) {
      setError("Veuillez sélectionner une image");
      return;
    }

    // Vérifier la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("L'image est trop volumineuse (max 5MB)");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/location/locataires/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'upload");
      }

      const data = await res.json();
      setForm({ ...form, piece_identite: data.path });
      setPreviewImage(data.path);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = editingItem ? `/api/location/locataires/${editingItem.id}` : "/api/location/locataires";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: form.nom.trim(),
          contact: form.contact.trim() || null,
          profession: form.profession.trim() || null,
          piece_identite: form.piece_identite || null,
        }),
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
        let errorMessage = editingItem ? "Erreur lors de la modification du locataire" : "Erreur lors de l'enregistrement du locataire";
        if (data?.error) {
          if (typeof data.error === "string") {
            errorMessage = data.error;
          } else if (typeof data.error === "object") {
            errorMessage = JSON.stringify(data.error);
          }
        }
        const errorDetails = data?.details ? `\n\nDétails: ${typeof data.details === 'string' ? data.details : JSON.stringify(data.details)}` : "";
        throw new Error(errorMessage + errorDetails);
      }

      await Swal.fire({
        title: editingItem ? "Locataire modifié !" : "Locataire créé !",
        text: `Le locataire "${form.nom.trim()}" a été ${editingItem ? "modifié" : "créé"} avec succès.`,
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#10b981",
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMessage = err.message || (editingItem ? "Erreur lors de la modification du locataire" : "Erreur lors de l'enregistrement du locataire");
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-3 py-6 sm:px-6 sm:py-10"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[28px] w-full max-w-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-5 py-5 sm:px-8 sm:py-6 flex items-start justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/70 font-semibold">ACAJOU</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mt-1">
              {editingItem ? "Modifier le locataire" : "Nouveau locataire"}
            </h2>
            <p className="text-white/80 text-sm mt-2 max-w-md">
              {editingItem
                ? "Mettez à jour les informations du locataire."
                : "Renseignez les informations essentielles pour enregistrer un nouveau locataire."}
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

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={submit} className="p-5 sm:p-8 space-y-6">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm font-medium">
                {error}
              </div>
            )}

            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 sm:p-5 space-y-4">
              <div>
                <label className={labelClass}>
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <input
                  className={inputClass}
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  placeholder="Nom complet du locataire"
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Contact</label>
                <input
                  className={inputClass}
                  type="tel"
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  placeholder="Téléphone ou email"
                />
              </div>
              <div>
                <label className={labelClass}>Profession (Facultatif)</label>
                <input
                  className={inputClass}
                  value={form.profession}
                  onChange={(e) => setForm({ ...form, profession: e.target.value })}
                  placeholder="Profession du locataire"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-white p-4 sm:p-5 space-y-4">
              <label className={labelClass}>Pièce d'identité (Image)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="space-y-3">
                {previewImage ? (
                  <div className="relative">
                    <img
                      src={previewImage}
                      alt="Pièce d'identité"
                      className="w-full max-h-64 object-contain rounded-xl border-2 border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewImage(null);
                        setForm({ ...form, piece_identite: "" });
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition"
                      aria-label="Supprimer l'image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition"
                  >
                    <svg
                      className="mx-auto h-12 w-12 text-slate-400 mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-sm text-slate-600 font-medium">
                      {uploading ? "Upload en cours..." : "Cliquez pour télécharger une image"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">PNG, JPG, JPEG jusqu'à 5MB</p>
                  </div>
                )}
                {!previewImage && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                    disabled={uploading}
                  >
                    {uploading ? "Upload en cours..." : "Choisir un fichier"}
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all"
                disabled={loading || uploading}
              >
                {loading ? "Enregistrement..." : editingItem ? "Enregistrer les modifications" : "Enregistrer le locataire"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
