"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

type User = { email?: string | null; name?: string | null; role?: string | null };

export default function SidebarClient({ user }: { user?: User }) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/admin", label: "Admin", icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2l3 6 6 .5-4.5 3 1.5 6L12 15l-6 3 1.5-6L3 8.5 9 8 12 2z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ) },
    { href: "/pharmacie", label: "Pharmacie", icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2v20M2 12h20" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ) },
    { href: "/pharmacie/rapports", label: "Rapports & Statistiques", icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M3 3h18v4H3z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 11h14v10H5z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 7v4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ) },
    { href: "/restaurant", label: "Restaurant", icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M7 7h10M7 12h10M7 17h10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ) },
    { href: "/restaurant/tables", label: "Gestion des tables", icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 7h18v10H3z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 7v10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M17 7v10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ) },
  ];

  return (
    <div>
      {/* Mobile header with toggle */}
      <div className="md:hidden flex items-center justify-between mb-4">
        <div className="text-lg font-semibold text-blue-700">Gestion</div>
        <button onClick={() => setOpen((s) => !s)} className="p-2 rounded-md bg-white border">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      <div className={`${open ? "block" : "hidden"} md:block`}> 
        <div className="hidden md:block text-xl font-semibold text-blue-700 mb-6">Gestion</div>
        <nav className="space-y-2 text-sm">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link key={l.href} className={`flex items-center gap-3 rounded px-3 py-2 hover:bg-blue-50 transition-colors ${active ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`} href={l.href}>
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded ${active ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}>{l.icon}</span>
                <span>{l.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 pt-4 border-t border-gray-100 text-sm">
          <div className="text-gray-500">Connecté en tant que</div>
          <div className="mt-1 font-medium text-gray-900">{user?.email ?? user?.name ?? 'Utilisateur'}</div>
          <div className="mt-2 text-xs text-gray-400">{user?.role ?? ''}</div>
        </div>
      </div>
    </div>
  );
}
