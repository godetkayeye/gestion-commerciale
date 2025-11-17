"use client";

import { FormEvent, useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({
    currentEmail: "",
    newEmail: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Identifiants invalides");
      return;
    }
    // wait for session to be available, then redirect based on role
    let session = await getSession();
    // session might not be immediately available; poll briefly
    let attempts = 0;
    while (!session?.user && attempts < 8) {
      // small delay
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 150));
      // eslint-disable-next-line no-await-in-loop
      session = await getSession();
      attempts += 1;
    }

    const role = (session?.user?.role || "").toString().toUpperCase();
    if (role === "ADMIN") router.replace("/admin");
    else if (role === "MANAGER_MULTI") router.replace("/manager");
    else if (role === "PHARMACIEN" || role === "GERANT_PHARMACIE") router.replace("/pharmacie");
    else if (role === "SERVEUR" || role === "GERANT_RESTAURANT") router.replace("/restaurant");
    else if (role === "CAISSE_RESTAURANT") router.replace("/caisse/restaurant");
    else if (role === "CAISSE_BAR") router.replace("/caisse/bar");
    else if (role === "CAISSE_LOCATION") router.replace("/caisse/location");
    else if (role === "BAR") router.replace("/bar");
    else if (role === "LOCATION") router.replace("/location");
    else if (role === "CONSEIL_ADMINISTRATION") router.replace("/conseil");
    else if (role === "ECONOMAT") router.replace("/economat");
    else if (role === "SUPERVISEUR") router.replace("/superviseur");
    else router.replace("/");
  };

  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);

    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      setProfileError("Les nouveaux mots de passe ne correspondent pas");
      return;
    }

    if (profileData.newPassword && profileData.newPassword.length < 6) {
      setProfileError("Le nouveau mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setProfileLoading(true);
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
        setProfileError(data.error || "Erreur lors de la mise à jour");
        return;
      }

      setProfileSuccess(true);
      setProfileData({
        currentEmail: "",
        newEmail: "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setTimeout(() => {
        setShowProfileModal(false);
        setProfileSuccess(false);
      }, 2000);
    } catch (err) {
      setProfileError("Erreur de connexion");
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-3 sm:px-4 py-8 sm:py-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="w-full max-w-md">
        {/* Logo/Titre */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 rounded-2xl mb-4 sm:mb-5 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <span className="text-2xl sm:text-3xl font-bold text-white">V</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2 sm:mb-3">
            VILAKAZI
          </h1>
          <p className="text-sm sm:text-base text-gray-600 font-medium">Connectez-vous à votre compte</p>
        </div>

        {/* Formulaire */}
        <form
          onSubmit={onSubmit}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 md:p-10 space-y-5 sm:space-y-6 backdrop-blur-sm"
        >
          <div className="space-y-4 sm:space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-800">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full px-4 py-3.5 text-base border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 hover:bg-white"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
              />
            </div>

            {/* Mot de passe */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-800">
                Mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  className="w-full px-4 py-3.5 pr-12 text-base border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-gray-50 hover:bg-white"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? (
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
          </div>

          {/* Erreur */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 animate-in fade-in">
              <p className="text-sm text-red-700 font-semibold flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            </div>
          )}

          {/* Bouton */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 hover:from-indigo-700 hover:via-blue-700 hover:to-purple-700 text-white font-bold rounded-xl py-3.5 sm:py-4 px-6 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center text-base sm:text-lg transform hover:scale-[1.02]"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Connexion en cours...</span>
              </>
            ) : (
              "Se connecter"
            )}
          </button>

          {/* Lien modifier profil */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setShowProfileModal(true)}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold transition-colors underline-offset-2 hover:underline"
            >
              Modifier mon email ou mot de passe
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-6 sm:mt-8 text-center space-y-2">
          <p className="text-xs sm:text-sm text-gray-600 font-medium">
            Fait par <span className="font-bold text-indigo-600">MAKABONTECH</span>
          </p>
          <p className="text-xs text-gray-500">
            © 2025 Gestion Commerciale. Tous droits réservés.
          </p>
        </div>
      </div>

      {/* Modal Modifier Profil */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Modifier mon profil</h2>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  setProfileError(null);
                  setProfileSuccess(false);
                  setProfileData({
                    currentEmail: "",
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

              {/* Messages d'erreur/succès */}
              {profileError && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-700 font-semibold">{profileError}</p>
                </div>
              )}

              {profileSuccess && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <p className="text-sm text-green-700 font-semibold">Profil mis à jour avec succès !</p>
                </div>
              )}

              {/* Boutons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileModal(false);
                    setProfileError(null);
                    setProfileSuccess(false);
                    setProfileData({
                      currentEmail: "",
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
      )}
    </div>
  );
}

export default LoginPage;
