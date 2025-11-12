"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: "/auth/login" })} className="text-sm hover:underline">
      Déconnexion
    </button>
  );
}

