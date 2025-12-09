"use client";

import { useState, FormEvent } from "react";
import Swal from "sweetalert2";

interface ModalAjouterBienProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalAjouterBien({ isOpen, onClose, onSuccess }: ModalAjouterBienProps) {
  const [form, setForm] = useState({
    type: "APPARTEMENT",
    nom: "",
    niveau: "REZ_DE_CHAUSSEE",
    prix_mensuel: "",
    nombre_pieces: "",
    description: "",
    etat: "LIBRE",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const inputClass =
    "w-full rounded-2xl border-[1.5px] border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition";
  const labelClass = "block text-sm font-semibold text-slate-800 mb-1.5";

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/location/biens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          nom: form.nom.trim(),
          niveau: form.niveau,
          prix_mensuel: Number(form.prix_mensuel),
          nombre_pieces: Number(form.nombre_pieces),
          description: form.description?.trim() || null,
          etat: form.etat,
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
        let errorMessage = "Erreur lors de l'enregistrement du bien";
        if (data?.error) {
          if (typeof data.error === "string") {
            errorMessage = data.error;
          } else if (data.error?.message) {
            errorMessage = data.error.message;
          } else {
            errorMessage = data.details || errorMessage;
          }
        }
        const errorDetails = data?.details ? `\n\nDétails: ${typeof data.details === 'string' ? data.details : JSON.stringify(data.details)}` : "";
        throw new Error(errorMessage + errorDetails);
      }

      await Swal.fire({
        title: "Bien créé !",
        text: `Le bien "${form.nom.trim()}" a été créé avec succès.`,
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#10b981",
      });

      setForm({
        type: "APPARTEMENT",
        nom: "",
        niveau: "REZ_DE_CHAUSSEE",
        prix_mensuel: "",
        nombre_pieces: "",
        description: "",
        etat: "LIBRE",
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMessage = err.message || "Erreur lors de l'enregistrement du bien";
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
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 px-3 py-6 sm:px-6 sm:py-10"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[28px] w-full max-w-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-5 py-5 sm:px-8 sm:py-6 flex items-start justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/70 font-semibold">ACAJOU</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mt-1">Créer un nouveau bien</h2>
            <p className="text-white/80 text-sm mt-2 max-w-md">
              Complétez ce formulaire pour référencer rapidement un appartement ou un local. Tous les champs sont
              pensés pour être remplis depuis mobile ou desktop.
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 space-y-4">
                <div>
                  <label className={labelClass}>Type de bien</label>
                  <select
                    className={`${inputClass} bg-white`}
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    required
                  >
                    <option value="APPARTEMENT">Appartement</option>
                    <option value="LOCAL_COMMERCIAL">Local</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>État</label>
                  <select
                    className={`${inputClass} bg-white`}
                    value={form.etat}
                    onChange={(e) => setForm({ ...form, etat: e.target.value })}
                    required
                  >
                    <option value="LIBRE">Libre</option>
                    <option value="OCCUPE">Occupé</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 space-y-4">
                <div>
                  <label className={labelClass}>Nom du bien</label>
                  <input
                    className={inputClass}
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    placeholder="Ex : Studio A3"
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Niveau</label>
                  <select
                    className={`${inputClass} bg-white`}
                    value={form.niveau}
                    onChange={(e) => setForm({ ...form, niveau: e.target.value })}
                    required
                  >
                    <option value="REZ_DE_CHAUSSEE">Rez-de-chaussée</option>
                    <option value="N1">Niveau 1 (N1)</option>
                    <option value="N2">Niveau 2 (N2)</option>
                    <option value="N3">Niveau 3 (N3)</option>
                    <option value="N4">Niveau 4 (N4)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-white p-4 sm:p-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Prix {form.type === "APPARTEMENT" ? "par jour" : "par mois"} ($)</label>
                  <input
                    className={inputClass}
                    type="number"
                    step="0.01"
                    value={form.prix_mensuel}
                    onChange={(e) => setForm({ ...form, prix_mensuel: e.target.value })}
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {form.type === "APPARTEMENT"
                      ? "Tarification appliquée par jour pour les appartements."
                      : "Tarification mensuelle pour les locaux."}
                  </p>
                </div>
                <div>
                  <label className={labelClass}>Nombre des pièces</label>
                  <input
                    className={inputClass}
                    type="number"
                    min="1"
                    value={form.nombre_pieces}
                    onChange={(e) => setForm({ ...form, nombre_pieces: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-white p-4 sm:p-5">
              <label className={labelClass}>Description</label>
              <textarea
                className={`${inputClass} min-h-[120px] resize-none`}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ajoutez des détails utiles : exposition, équipements, remarques..."
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm font-medium">
                {error}
              </div>
            )}

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
                disabled={loading}
              >
                {loading ? "Enregistrement..." : "Enregistrer le bien"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

