"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  const handleSignOut = async () => {
    // Déconnexion sans redirection automatique
    await signOut({ redirect: false });
    // Forcer une redirection complète vers la page de login
    window.location.href = "/auth/login";
  };

  return (
    <button 
      onClick={handleSignOut}
      className="w-full md:w-auto text-xs md:text-sm bg-red-600 hover:bg-red-700 text-white px-3 md:px-4 py-2 rounded-lg transition-colors font-medium"
    >
      <span className="hidden md:inline">Déconnexion</span>
      <span className="inline md:hidden">Quitter</span>
    </button>
  );
}

