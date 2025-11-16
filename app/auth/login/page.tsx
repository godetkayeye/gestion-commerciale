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
    else router.replace("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-3 sm:px-4 py-8 sm:py-0 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        {/* Logo/Titre */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl mb-3 sm:mb-4 shadow-lg hover:shadow-xl transition-shadow">
            <span className="text-xl sm:text-2xl font-bold text-white">G</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Gestion Commerciale</h1>
          <p className="text-xs sm:text-sm text-gray-600">Connectez-vous à votre compte</p>
        </div>

        {/* Formulaire */}
        <form
          onSubmit={onSubmit}
          className="bg-white rounded-lg sm:rounded-xl shadow-md sm:shadow-lg border border-gray-200 p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5"
        >
          <div className="space-y-3 sm:space-y-4">
            {/* Email */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                Email
              </label>
              <input
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
              />
            </div>

            {/* Mot de passe */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                Mot de passe
              </label>
              <input
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 sm:p-3 animate-in fade-in">
              <p className="text-xs sm:text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Bouton */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg py-2.5 sm:py-3 px-4 shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="hidden xs:inline">Connexion en cours...</span>
                <span className="inline xs:hidden">Connexion...</span>
              </>
            ) : (
              "Se connecter"
            )}
          </button>

          {/* Footer */}
          <div className="text-center pt-3 sm:pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Système de gestion commerciale
            </p>
          </div>
        </form>

        {/* Footer additionnel */}
        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-xs text-gray-500">
            © 2025 Gestion Commerciale. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
