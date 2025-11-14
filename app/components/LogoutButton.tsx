"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button 
      onClick={() => signOut({ callbackUrl: "/auth/login" })} 
      className="w-full md:w-auto text-xs md:text-sm bg-red-600 hover:bg-red-700 text-white px-3 md:px-4 py-2 rounded-lg transition-colors font-medium"
    >
      <span className="hidden md:inline">Déconnexion</span>
      <span className="inline md:hidden">Quitter</span>
    </button>
  );
}

