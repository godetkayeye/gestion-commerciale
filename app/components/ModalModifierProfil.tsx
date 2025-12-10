"use client";

import { FormEvent, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";

interface ModalModifierProfilProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModalModifierProfil({ isOpen, onClose }: ModalModifierProfilProps) {
  const { data: session } = useSession();
  const [profileData, setProfileData] = useState({
    currentEmail: "",
    newEmail: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Initialiser l'email actuel avec celui de la session quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && session?.user?.email) {
      setProfileData((prev) => ({ ...prev, currentEmail: session?.user?.email || "" }));
    }
  }, [isOpen, session?.user?.email]);

  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileLoading(true);

    // Validation
    if (!profileData.currentEmail || !profileData.currentPassword) {
      setProfileError("L'email actuel et le mot de passe actuel sont requis");
      setProfileLoading(false);
      return;
    }

    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      setProfileError("Les nouveaux mots de passe ne correspondent pas");
      setProfileLoading(false);
      return;
    }

    if (profileData.newPassword && profileData.newPassword.length < 6) {
      setProfileError("Le nouveau mot de passe doit contenir au moins 6 caractères");
      setProfileLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentEmail: profileData.currentEmail,
          newEmail: profileData.newEmail || undefined,
          currentPassword: profileData.currentPassword,
          newPassword: profileData.newPassword || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour du profil");
      }

      await Swal.fire({
        title: "Profil mis à jour !",
        text: "Vos informations ont été mises à jour avec succès.",
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#10b981",
      });

      // Réinitialiser le formulaire
      setProfileData({
        currentEmail: session?.user?.email || "",
        newEmail: "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      onClose();
    } catch (err: any) {
      console.error("Erreur lors de la mise à jour du profil:", err);
      await Swal.fire({
        title: "Erreur",
        text: err.message || "Erreur lors de la mise à jour du profil",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#ef4444",
      });
      setProfileError(err.message || "Erreur lors de la mise à jour du profil");
    } finally {
      setProfileLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in zoom-in-95">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Modifier mon profil</h2>
          <button
            onClick={() => {
              onClose();
              setProfileError(null);
              setProfileData({
                currentEmail: session?.user?.email || "",
                newEmail: "",
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
              });
              setShowCurrentPassword(false);
              setShowNewPassword(false);
              setShowConfirmPassword(false);
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          {/* Email actuel */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-800">
              Email actuel <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 hover:bg-white"
              type="email"
              value={profileData.currentEmail || ""}
              onChange={(e) => setProfileData({ ...profileData, currentEmail: e.target.value })}
              placeholder="votre@email.com"
              required
            />
          </div>

          {/* Nouvel email */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-800">
              Nouvel email (optionnel)
            </label>
            <input
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 hover:bg-white"
              type="email"
              value={profileData.newEmail || ""}
              onChange={(e) => setProfileData({ ...profileData, newEmail: e.target.value })}
              placeholder="nouveau@email.com"
            />
          </div>

          {/* Mot de passe actuel */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-800">
              Mot de passe actuel <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 hover:bg-white"
                type={showCurrentPassword ? "text" : "password"}
                value={profileData.currentPassword || ""}
                onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
                aria-label={showCurrentPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showCurrentPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Nouveau mot de passe */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-800">
              Nouveau mot de passe (optionnel)
            </label>
            <div className="relative">
              <input
                className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 hover:bg-white"
                type={showNewPassword ? "text" : "password"}
                value={profileData.newPassword || ""}
                onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
                aria-label={showNewPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showNewPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Confirmer nouveau mot de passe */}
          {profileData.newPassword && (
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-800">
                Confirmer le nouveau mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 hover:bg-white"
                  type={showConfirmPassword ? "text" : "password"}
                  value={profileData.confirmPassword || ""}
                  onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  required={!!profileData.newPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
                  aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Messages d'erreur */}
          {profileError && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-700 font-semibold">{profileError}</p>
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                setProfileError(null);
                setProfileData({
                  currentEmail: session?.user?.email || "",
                  newEmail: "",
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: "",
                });
                setShowCurrentPassword(false);
                setShowNewPassword(false);
                setShowConfirmPassword(false);
              }}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={profileLoading || !profileData.currentPassword || !profileData.currentEmail}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {profileLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Mise à jour...</span>
                </>
              ) : (
                "Enregistrer"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

