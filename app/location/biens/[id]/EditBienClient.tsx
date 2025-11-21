"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Bien {
  id: number;
  type: string;
  nom: string | null;
  niveau: string | null;
  adresse: string;
  superficie: number;
  prix_mensuel: number;
  description: string | null;
  etat: string;
  nombre_pieces: number | null;
}

const inputClass =
  "w-full rounded-2xl border-[1.5px] border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition";
const labelClass = "block text-sm font-semibold text-slate-800 mb-1.5";

interface Props {
  bien: Bien;
}

export default function EditBienClient({ bien }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    type: bien.type,
    nom: bien.nom ?? "",
    niveau: bien.niveau ?? "REZ_DE_CHAUSSEE",
    superficie: bien.superficie?.toString() ?? "",
    prix_mensuel: bien.prix_mensuel?.toString() ?? "",
    nombre_pieces: bien.nombre_pieces?.toString() ?? "",
    description: bien.description ?? "",
    etat: bien.etat ?? "LIBRE",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/location/biens/${bien.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          nom: form.nom,
          niveau: form.niveau,
          superficie: Number(form.superficie),
          prix_mensuel: Number(form.prix_mensuel),
          nombre_pieces: Number(form.nombre_pieces),
          description: form.description || null,
          etat: form.etat,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Mise à jour impossible");
      }
      alert("Bien mis à jour avec succès");
      router.refresh();
      router.push("/location/biens");
    } catch (error: any) {
      alert(error?.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 sm:p-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Type de bien</label>
          <select className={inputClass} value={form.type} onChange={(e) => handleChange("type", e.target.value)} required>
            <option value="APPARTEMENT">Appartement</option>
            <option value="LOCAL_COMMERCIAL">Local</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>État</label>
          <select className={inputClass} value={form.etat} onChange={(e) => handleChange("etat", e.target.value)} required>
            <option value="LIBRE">Libre</option>
            <option value="OCCUPE">Occupé</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Nom du bien</label>
          <input
            className={inputClass}
            value={form.nom}
            onChange={(e) => handleChange("nom", e.target.value)}
            placeholder="Ex : Studio A3"
            required
          />
        </div>
        <div>
          <label className={labelClass}>Niveau</label>
          <select className={inputClass} value={form.niveau} onChange={(e) => handleChange("niveau", e.target.value)} required>
            <option value="REZ_DE_CHAUSSEE">Rez-de-chaussée</option>
            <option value="N1">Niveau 1 (N1)</option>
            <option value="N2">Niveau 2 (N2)</option>
            <option value="N3">Niveau 3 (N3)</option>
            <option value="N4">Niveau 4 (N4)</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white p-4 sm:p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Superficie (m²)</label>
            <input
              className={inputClass}
              type="number"
              step="0.01"
              value={form.superficie}
              onChange={(e) => handleChange("superficie", e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Prix {form.type === "APPARTEMENT" ? "par jour" : "par mois"} (FC)</label>
            <input
              className={inputClass}
              type="number"
              step="0.01"
              value={form.prix_mensuel}
              onChange={(e) => handleChange("prix_mensuel", e.target.value)}
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              {form.type === "APPARTEMENT"
                ? "Tarif appliqué par jour pour les appartements."
                : "Tarif appliqué par mois pour les locaux."}
            </p>
          </div>
        </div>
        <div>
          <label className={labelClass}>Nombre des pièces</label>
          <input
            className={inputClass}
            type="number"
            min="1"
            value={form.nombre_pieces}
            onChange={(e) => handleChange("nombre_pieces", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white p-4 sm:p-6">
        <label className={labelClass}>Description</label>
        <textarea
          className={`${inputClass} min-h-[130px] resize-none`}
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Ajoutez des détails utiles : exposition, équipements, remarques..."
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={() => router.push("/location/biens")}
          className="w-full sm:w-auto px-5 py-2.5 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
      </div>
    </form>
  );
}

