"use client";

import { useState } from "react";

type Role =
  | "ADMIN"
  | "PHARMACIEN"
  | "SERVEUR"
  | "CAISSIER"
  | "GERANT_RESTAURANT"
  | "GERANT_PHARMACIE"
  | "BAR"
  | "LOCATION"
  | "MANAGER_MULTI"
  | "CAISSE_RESTAURANT"
  | "CAISSE_BAR"
  | "CAISSE_LOCATION";

const roleLabels: Record<Role, string> = {
  ADMIN: "Administrateur",
  PHARMACIEN: "Pharmacien",
  SERVEUR: "Serveur",
  CAISSIER: "Caissier",
  GERANT_RESTAURANT: "Gérant Restaurant",
  GERANT_PHARMACIE: "Gérant Pharmacie",
  BAR: "Bar",
  LOCATION: "Location",
  MANAGER_MULTI: "Manager Multi (Bar/Restaurant/Location)",
  CAISSE_RESTAURANT: "Caisse Restaurant",
  CAISSE_BAR: "Caisse Bar/Terrasse",
  CAISSE_LOCATION: "Caisse Location",
};

export default function CreateUserForm({ onSuccessAction }: { onSuccessAction?: () => Promise<void> }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    nom: "",
    email: "",
    mot_de_passe: "",
    role: "" as Role | "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la création");

      // reset form
      setForm({ nom: "", email: "", mot_de_passe: "", role: "" });

      // if parent provided an onSuccessAction, call it (server revalidation etc.)
      if (onSuccessAction) {
        await onSuccessAction();
      } else {
        // no parent callback: reload page to show the new user in the server-rendered list
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      }
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
        <input
          type="text"
          name="nom"
          value={form.nom}
          onChange={(e) => setForm((s) => ({ ...s, nom: e.target.value }))}
          required
          className="block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
          required
          className="block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
        <input
          type="password"
          name="mot_de_passe"
          value={form.mot_de_passe}
          onChange={(e) => setForm((s) => ({ ...s, mot_de_passe: e.target.value }))}
          required
          className="block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
        <select
          name="role"
          value={form.role}
          onChange={(e) => setForm((s) => ({ ...s, role: e.target.value as Role }))}
          required
          className="block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- Choisir un rôle --</option>
          {Object.entries(roleLabels).map(([role, label]) => (
            <option key={role} value={role}>{label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 transition-colors disabled:opacity-50"
        >
          {loading ? "Création..." : "Créer l'utilisateur"}
        </button>
      </div>
    </form>
  );
}