"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ROLE_LABELS, Role } from "@/lib/roles";
import Swal from "sweetalert2";

interface DashboardUser {
  id: number;
  nom: string;
  email: string;
  role: Role;
  date_creation: string | null;
}

interface ManagerDashboardClientProps {
  // Bar/Terrasse
  commandesBarRecentes: any[];
  boissonsStockBas: any[];
  commandesBarEnCours: number;
  totalBoissons: number;
  commandesBarValideesMois: number;
  facturesBarMois: number;
  // Restaurant
  commandesRestaurantRecentes: any[];
  commandesRestaurantEnCours: number;
  // Location
  biensLibres: number;
  biensOccupes: number;
  biensMaintenance: number;
  tauxOccupation: string;
  paiementsRecents: any[];
  locatairesEnRetard: any[];
  totalBiens: number;
  contratsActifs: number;
  loyersImpayes: number;
  // Users
  users: DashboardUser[];
  assignableRoles: Readonly<Role[]>;
}

export default function ManagerDashboardClient({
  commandesBarRecentes,
  boissonsStockBas,
  commandesBarEnCours,
  totalBoissons,
  commandesBarValideesMois,
  facturesBarMois,
  commandesRestaurantRecentes,
  commandesRestaurantEnCours,
  biensLibres,
  biensOccupes,
  biensMaintenance,
  tauxOccupation,
  paiementsRecents,
  locatairesEnRetard,
  totalBiens,
  contratsActifs,
  loyersImpayes,
  users: initialUsers,
  assignableRoles,
}: ManagerDashboardClientProps) {
  const [users, setUsers] = useState<DashboardUser[]>(initialUsers);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<DashboardUser | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  
  // État pour le modal de taux de change
  const [showTauxModal, setShowTauxModal] = useState(false);
  const [tauxChange, setTauxChange] = useState<number>(2200);
  const [tauxLoading, setTauxLoading] = useState(false);
  const [tauxError, setTauxError] = useState<string | null>(null);
  const [tauxSuccess, setTauxSuccess] = useState<string | null>(null);
  const [userForm, setUserForm] = useState<{
    nom: string;
    email: string;
    role: Role | "";
    mot_de_passe: string;
  }>({
    nom: "",
    email: "",
    role: assignableRoles[0] ?? "",
    mot_de_passe: "",
  });

  // Charger le taux de change au montage du composant
  useEffect(() => {
    loadTauxChange();
  }, []);

  const resetForm = () => {
    setUserForm({
      nom: "",
      email: "",
      role: assignableRoles[0] ?? "",
      mot_de_passe: "",
    });
    setFormError(null);
    setFormSuccess(null);
    setFormLoading(false);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    resetForm();
    setShowUserModal(true);
  };

  const openEditModal = (user: DashboardUser) => {
    setEditingUser(user);
    setUserForm({
      nom: user.nom,
      email: user.email,
      role: user.role,
      mot_de_passe: "",
    });
    setFormError(null);
    setFormSuccess(null);
    setShowUserModal(true);
  };

  const closeModal = () => {
    resetForm();
    setEditingUser(null);
    setShowUserModal(false);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.role) {
      setFormError("Veuillez sélectionner un rôle");
      return;
    }

    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const payload: Record<string, string> = {
        nom: userForm.nom,
        email: userForm.email,
        role: userForm.role,
      };
      if (!editingUser) {
        payload.mot_de_passe = userForm.mot_de_passe;
      } else if (userForm.mot_de_passe) {
        payload.mot_de_passe = userForm.mot_de_passe;
      }

      const endpoint = editingUser ? `/api/manager/users/${editingUser.id}` : "/api/manager/users";
      const method = editingUser ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Vérifier le type de contenu de la réponse
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        throw new Error(text || `Erreur ${res.status}: ${res.statusText}`);
      }

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
        // Inclure les détails de l'erreur si disponibles
        const errorMessage = data.error || "Impossible d'enregistrer l'utilisateur";
        const errorDetails = data.details ? `\n\nDétails: ${typeof data.details === 'string' ? data.details : JSON.stringify(data.details)}` : "";
        throw new Error(errorMessage + errorDetails);
      }

      if (editingUser) {
        setUsers((prev) => prev.map((u) => (u.id === data.user.id ? data.user : u)));
        // Message de succès pour la modification
        await Swal.fire({
          title: "Utilisateur modifié !",
          text: `L'utilisateur ${data.user.nom || userForm.nom} a été modifié avec succès.`,
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#10b981",
        });
      } else {
        setUsers((prev) => [data.user, ...prev]);
        // Message de succès pour la création
        await Swal.fire({
          title: "Utilisateur créé !",
          text: `L'utilisateur ${data.user.nom || userForm.nom} a été créé avec succès.`,
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#10b981",
        });
      }

      setFormSuccess(editingUser ? "Utilisateur mis à jour" : "Utilisateur créé");
      setTimeout(() => {
        closeModal();
      }, 800);
    } catch (error: any) {
      console.error("Erreur lors de l'enregistrement de l'utilisateur:", error);
      
      // Formater le message d'erreur pour SweetAlert
      let errorMessage = error.message || "Erreur lors de l'enregistrement de l'utilisateur";
      
      // Si le message contient des détails, les formater mieux
      if (errorMessage.includes("Détails:")) {
        const parts = errorMessage.split("Détails:");
        errorMessage = parts[0].trim();
        const details = parts[1]?.trim();
        if (details) {
          try {
            const parsedDetails = JSON.parse(details);
            if (parsedDetails && typeof parsedDetails === 'object') {
              const detailMessages = Object.entries(parsedDetails)
                .map(([key, value]: [string, any]) => {
                  if (Array.isArray(value) && value.length > 0) {
                    return `${key}: ${value[0]}`;
                  }
                  return `${key}: ${value}`;
                })
                .join('\n');
              if (detailMessages) {
                errorMessage += `\n\n${detailMessages}`;
              }
            } else {
              errorMessage += `\n\n${details}`;
            }
          } catch {
            errorMessage += `\n\n${details}`;
          }
        }
      }
      
      await Swal.fire({
        title: "Erreur",
        text: errorMessage,
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#ef4444",
        width: "500px",
      });
      setFormError(error.message || "Erreur inconnue");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (user: DashboardUser) => {
    const confirmed = window.confirm(`Supprimer ${user.nom} ?`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/manager/users/${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Impossible de supprimer cet utilisateur");
      }
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (error: any) {
      alert(error.message || "Erreur lors de la suppression");
    }
  };

  // Fonctions pour le taux de change
  const loadTauxChange = async () => {
    try {
      const res = await fetch("/api/manager/taux-change");
      const data = await res.json();
      if (res.ok) {
        setTauxChange(data.taux_change || 2200);
      }
    } catch (error) {
      console.error("Erreur lors du chargement du taux", error);
    }
  };

  const openTauxModal = async () => {
    await loadTauxChange();
    setTauxError(null);
    setTauxSuccess(null);
    setShowTauxModal(true);
  };

  const handleTauxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tauxChange || tauxChange <= 0) {
      setTauxError("Le taux de change doit être supérieur à 0");
      return;
    }

    setTauxLoading(true);
    setTauxError(null);
    setTauxSuccess(null);

    try {
      const res = await fetch("/api/manager/taux-change", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taux_change: Number(tauxChange) }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Impossible de mettre à jour le taux");
      }
      setTauxSuccess(data.message || "Taux de change mis à jour avec succès");
      // Recharger le taux depuis l'API pour mettre à jour l'affichage
      await loadTauxChange();
      setTimeout(() => {
        setShowTauxModal(false);
      }, 1500);
    } catch (error: any) {
      setTauxError(error.message || "Erreur inconnue");
    } finally {
      setTauxLoading(false);
    }
  };
  return (
    <div className="space-y-6">
      {/* Configuration système */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Configuration système</p>
            <h2 className="text-xl font-bold text-gray-900">Paramètres généraux</h2>
            <p className="text-sm text-gray-500">Gérez les paramètres globaux de l'application</p>
          </div>
          <button
            onClick={openTauxModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Modifier le taux de change
          </button>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <span className="text-sm font-medium text-gray-700">Taux de change actuel</span>
              <p className="text-xs text-gray-500 mt-1">1 $ = {tauxChange} FC</p>
            </div>
            <span className="text-lg font-bold text-indigo-700">{tauxChange} FC/$</span>
          </div>
        </div>
      </div>

      {/* Gestion des utilisateurs */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gray-50 border-b border-gray-200 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Gestion des utilisateurs</p>
            <h2 className="text-xl font-bold text-gray-900">Créer, modifier ou supprimer des accès</h2>
            <p className="text-sm text-gray-500">Les administrateurs ne sont pas visibles ici.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 transition-colors"
          >
            + Nouvel utilisateur
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Nom</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Rôle</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                    Aucun utilisateur pour le moment.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900">{user.nom}</td>
                    <td className="px-4 py-3 text-gray-700">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        className="text-sm font-semibold text-red-600 hover:text-red-800"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Module Bar/Terrasse */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">B</div>
            BLACK & WHITE
          </h2>
          <Link href="/bar" className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">
            Accéder au module →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Commandes récentes Bar */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-blue-50 border-b border-gray-200 px-3 md:px-4 py-2 md:py-3 flex justify-between items-center">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Commandes récentes</h3>
              <Link href="/bar/commandes" className="text-xs md:text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">
                Voir toutes →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-2 md:px-4 py-2 md:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">#</th>
                    <th className="text-left px-2 md:px-4 py-2 md:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Table</th>
                    <th className="hidden sm:table-cell text-left px-2 md:px-4 py-2 md:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Serveur</th>
                    <th className="text-left px-2 md:px-4 py-2 md:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Statut</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {commandesBarRecentes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-2 md:px-4 py-4 md:py-8 text-center text-xs md:text-sm text-gray-500">
                        Aucune commande récente
                      </td>
                    </tr>
                  ) : (
                    commandesBarRecentes.map((c, idx) => (
                      <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                        <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                          <span className="text-xs md:text-sm font-semibold text-gray-900">#{c.id}</span>
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                          <span className="text-xs md:text-sm text-gray-900 font-medium">{c.table?.nom ?? "-"}</span>
                        </td>
                        <td className="hidden sm:table-cell px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                          <span className="text-xs md:text-sm text-gray-900">{c.serveur?.nom ?? "-"}</span>
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 md:px-2.5 py-1 md:py-0.5 rounded-full text-xs font-semibold ${
                            c.status === "VALIDEE" ? "bg-green-100 text-green-800" :
                            c.status === "EN_COURS" ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {c.status === "VALIDEE" ? "Validée" : c.status === "EN_COURS" ? "En cours" : "Annulée"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Boissons en faible stock */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-red-50 border-b border-gray-200 px-3 md:px-4 py-2 md:py-3">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Alertes stock faible</h3>
            </div>
            <div className="p-3 md:p-4">
              {boissonsStockBas.length === 0 ? (
                <div className="text-center py-6 md:py-8">
                  <div className="text-base md:text-lg text-gray-500 mb-2">✓</div>
                  <div className="text-xs md:text-sm text-gray-500 font-medium">Aucune alerte</div>
                  <div className="text-xs text-gray-400 mt-1">Tous les stocks sont suffisants</div>
                </div>
              ) : (
                <div className="space-y-2 md:space-y-3">
                  {boissonsStockBas.map((b) => (
                    <div key={b.id} className="flex justify-between items-center p-2 md:p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs md:text-sm text-gray-900 mb-1 truncate">{b.nom}</div>
                        <div className="text-xs text-gray-600">
                          Stock: <span className="font-bold text-red-700">{Number(b.stock).toFixed(2)}</span> {b.unite_mesure}
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white whitespace-nowrap">
                        Faible
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Module Restaurant */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white font-bold">R</div>
            VILAKAZI
          </h2>
          <Link href="/restaurant" className="text-sm font-medium text-green-600 hover:text-green-800 hover:underline">
            Accéder au module →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Commandes récentes Restaurant */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-green-50 border-b border-gray-200 px-3 md:px-4 py-2 md:py-3 flex justify-between items-center">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Commandes récentes</h3>
              <Link href="/restaurant/commandes" className="text-xs md:text-sm font-medium text-green-600 hover:text-green-800 hover:underline">
                Voir toutes →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-2 md:px-4 py-2 md:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">#</th>
                    <th className="text-left px-2 md:px-4 py-2 md:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Table</th>
                    <th className="text-left px-2 md:px-4 py-2 md:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Statut</th>
                    <th className="text-left px-2 md:px-4 py-2 md:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {commandesRestaurantRecentes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-2 md:px-4 py-4 md:py-8 text-center text-xs md:text-sm text-gray-500">
                        Aucune commande récente
                      </td>
                    </tr>
                  ) : (
                    commandesRestaurantRecentes.map((c, idx) => (
                      <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                        <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                          <span className="text-xs md:text-sm font-semibold text-gray-900">#{c.id}</span>
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                          <span className="text-xs md:text-sm text-gray-900 font-medium">{c.table_numero ?? "-"}</span>
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 md:px-2.5 py-1 md:py-0.5 rounded-full text-xs font-semibold ${
                            c.statut === "PAYE" ? "bg-green-100 text-green-800" :
                            c.statut === "SERVI" ? "bg-blue-100 text-blue-800" :
                            c.statut === "EN_PREPARATION" ? "bg-yellow-100 text-yellow-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {c.statut === "PAYE" ? "Payé" : c.statut === "SERVI" ? "Servi" : c.statut === "EN_PREPARATION" ? "En préparation" : "En attente"}
                          </span>
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                          <span className="text-xs md:text-sm font-semibold text-gray-900">{Number(c.total ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statistiques Restaurant */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-green-50 border-b border-gray-200 px-3 md:px-4 py-2 md:py-3">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Statistiques</h3>
            </div>
            <div className="p-3 md:p-4 space-y-3 md:space-y-4">
              <div className="flex justify-between items-center p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-xs md:text-sm font-medium text-gray-700">Commandes en cours</span>
                <span className="text-base md:text-lg font-bold text-orange-700">{commandesRestaurantEnCours}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Module Location */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold">L</div>
            ACAJOU
          </h2>
          <Link href="/location" className="text-sm font-medium text-purple-600 hover:text-purple-800 hover:underline">
            Accéder au module →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Paiements récents Location */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-purple-50 border-b border-gray-200 px-3 md:px-4 py-2 md:py-3 flex justify-between items-center">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Paiements récents</h3>
              <Link href="/location/paiements" className="text-xs md:text-sm font-medium text-purple-600 hover:text-purple-800 hover:underline">
                Voir tous →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-2 md:px-4 py-2 md:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="text-left px-2 md:px-4 py-2 md:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Locataire</th>
                    <th className="text-left px-2 md:px-4 py-2 md:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Montant</th>
                    <th className="text-left px-2 md:px-4 py-2 md:py-3 text-xs font-semibold text-gray-700 uppercase tracking-wider">Reste dû</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {paiementsRecents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-2 md:px-4 py-4 md:py-8 text-center text-xs md:text-sm text-gray-500">
                        Aucun paiement récent
                      </td>
                    </tr>
                  ) : (
                    paiementsRecents.map((p, idx) => (
                      <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                        <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                          <span className="text-xs md:text-sm text-gray-900">
                            {new Date(p.date_paiement).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                          </span>
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                          <span className="text-xs md:text-sm text-gray-900 font-medium">{p.contrat?.locataire?.nom ?? "-"}</span>
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                          <span className="text-xs md:text-sm font-semibold text-gray-900">{Number(p.montant).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC</span>
                        </td>
                        <td className="px-2 md:px-4 py-2 md:py-3 whitespace-nowrap">
                          {Number(p.reste_du) > 0 ? (
                            <span className="inline-flex items-center px-2 md:px-2.5 py-1 md:py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                              {Number(p.reste_du).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 md:px-2.5 py-1 md:py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              Payé
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Locataires en retard */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-red-50 border-b border-gray-200 px-3 md:px-4 py-2 md:py-3 flex justify-between items-center">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">Locataires en retard</h3>
              {loyersImpayes > 0 && (
                <span className="text-xs md:text-sm font-semibold text-red-700">
                  Total: {loyersImpayes.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC
                </span>
              )}
            </div>
            <div className="p-3 md:p-4">
              {locatairesEnRetard.length === 0 ? (
                <div className="text-center py-6 md:py-8">
                  <div className="text-base md:text-lg text-gray-500 mb-2">✓</div>
                  <div className="text-xs md:text-sm text-gray-500 font-medium">Aucun retard</div>
                  <div className="text-xs text-gray-400 mt-1">Tous les loyers sont à jour</div>
                </div>
              ) : (
                <div className="space-y-2 md:space-y-3">
                  {locatairesEnRetard.map((p) => (
                    <div key={p.id} className="flex justify-between items-center p-2 md:p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs md:text-sm font-semibold text-gray-900 truncate">{p.contrat?.locataire?.nom ?? "N/A"}</div>
                        <div className="text-xs text-gray-600 mt-1 truncate">{p.contrat?.bien?.adresse ?? "N/A"}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          Pénalité: {Number(p.penalite).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC | 
                          Reste: {Number(p.reste_du).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} FC
                        </div>
                      </div>
                      <span className="inline-flex items-center px-2 md:px-2.5 py-1 md:py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 whitespace-nowrap">
                        Retard
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Accès rapide, Statistiques et Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Accès rapide */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-indigo-50 border-b border-gray-200 px-3 md:px-4 py-2 md:py-3">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Accès rapide</h3>
          </div>
          <div className="p-2 md:p-4 flex flex-col gap-2">
            <Link className="px-3 md:px-4 py-2 md:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs md:text-sm font-medium text-center shadow-sm transition-colors" href="/bar">
              Bar / Terrasse
            </Link>
            <Link className="px-3 md:px-4 py-2 md:py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs md:text-sm font-medium text-center shadow-sm transition-colors" href="/restaurant">
              Restaurant
            </Link>
            <Link className="px-3 md:px-4 py-2 md:py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs md:text-sm font-medium text-center shadow-sm transition-colors" href="/location">
              Location
            </Link>
            <Link className="px-3 md:px-4 py-2 md:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs md:text-sm font-medium text-center shadow-sm transition-colors" href="/bar/rapports">
              Rapports Bar
            </Link>
            <Link className="px-3 md:px-4 py-2 md:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs md:text-sm font-medium text-center shadow-sm transition-colors" href="/location/rapports">
              Rapports Location
            </Link>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-purple-50 border-b border-gray-200 px-3 md:px-4 py-2 md:py-3">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Statistiques rapides</h3>
          </div>
          <div className="p-3 md:p-4 space-y-3 md:space-y-4">
            <div className="flex justify-between items-center p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-xs md:text-sm font-medium text-gray-700">Total boissons</span>
              <span className="text-base md:text-lg font-bold text-blue-700">{totalBoissons}</span>
            </div>
            <div className="flex justify-between items-center p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-xs md:text-sm font-medium text-gray-700">Commandes validées (mois)</span>
              <span className="text-base md:text-lg font-bold text-green-700">{commandesBarValideesMois}</span>
            </div>
            <div className="flex justify-between items-center p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-xs md:text-sm font-medium text-gray-700">Factures Bar (mois)</span>
              <span className="text-base md:text-lg font-bold text-indigo-700">{facturesBarMois}</span>
            </div>
            <div className="flex justify-between items-center p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-xs md:text-sm font-medium text-gray-700">Total biens</span>
              <span className="text-base md:text-lg font-bold text-purple-700">{totalBiens}</span>
            </div>
            <div className="flex justify-between items-center p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-xs md:text-sm font-medium text-gray-700">Contrats actifs</span>
              <span className="text-base md:text-lg font-bold text-green-700">{contratsActifs}</span>
            </div>
            <div className="flex justify-between items-center p-2 md:p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-xs md:text-sm font-medium text-gray-700">Taux d'occupation</span>
              <span className="text-base md:text-lg font-bold text-indigo-700">{tauxOccupation}%</span>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-green-50 border-b border-gray-200 px-3 md:px-4 py-2 md:py-3">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Actions rapides</h3>
          </div>
          <div className="p-3 md:p-4 flex flex-col gap-2">
            <Link className="px-3 md:px-4 py-2 md:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs md:text-sm font-medium text-center shadow-sm transition-colors" href="/bar/commandes">
              Gérer commandes Bar
            </Link>
            <Link className="px-3 md:px-4 py-2 md:py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs md:text-sm font-medium text-center shadow-sm transition-colors" href="/restaurant/commandes">
              Gérer commandes Restaurant
            </Link>
            <Link className="px-3 md:px-4 py-2 md:py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs md:text-sm font-medium text-center shadow-sm transition-colors" href="/location/contrats">
              Gérer contrats
            </Link>
            <Link className="px-3 md:px-4 py-2 md:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs md:text-sm font-medium text-center shadow-sm transition-colors" href="/location/paiements">
              Enregistrer paiement
            </Link>
          </div>
        </div>
      </div>

      {/* Modal de gestion des utilisateurs */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingUser ? "Modifier l'utilisateur" : "Créer un utilisateur"}
              </h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleUserSubmit} className="space-y-4 px-4 py-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                <input
                  type="text"
                  value={userForm.nom}
                  onChange={(e) => setUserForm((prev) => ({ ...prev, nom: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm((prev) => ({ ...prev, role: e.target.value as Role }))}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">-- Choisir un rôle --</option>
                  {assignableRoles.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingUser ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
                </label>
                <input
                  type="password"
                  value={userForm.mot_de_passe}
                  onChange={(e) => setUserForm((prev) => ({ ...prev, mot_de_passe: e.target.value }))}
                  required={!editingUser}
                  placeholder={editingUser ? "Laisser vide pour conserver l'actuel" : "******"}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {formSuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60"
                >
                  {formLoading ? "Enregistrement..." : editingUser ? "Mettre à jour" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de modification du taux de change */}
      {showTauxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Modifier le taux de change</h3>
                <p className="text-sm text-gray-600 mt-1">Définir le taux de conversion USD → FC</p>
              </div>
              <button 
                onClick={() => setShowTauxModal(false)} 
                className="text-gray-500 hover:text-gray-700 text-2xl font-light"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleTauxSubmit} className="space-y-4 px-6 py-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taux de change (1 $ = X FC)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={tauxChange}
                    onChange={(e) => setTauxChange(Number(e.target.value))}
                    required
                    className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-lg font-semibold text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                    placeholder="2200"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                    FC/$
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Exemple : Si vous saisissez 2200, cela signifie que 1 dollar = 2200 francs congolais
                </p>
              </div>

              {tauxError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {tauxError}
                </div>
              )}
              {tauxSuccess && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {tauxSuccess}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowTauxModal(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={tauxLoading}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60"
                >
                  {tauxLoading ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
