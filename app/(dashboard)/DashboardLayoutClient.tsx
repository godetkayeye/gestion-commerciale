"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LogoutButton from "@/app/components/LogoutButton";
import SidebarClient from "./SidebarClient";
import Logo from "@/app/components/Logo";

type User = { email?: string | null; name?: string | null; role?: string | null };

export default function DashboardLayoutClient({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: User;
}) {
  const pathname = usePathname() || "/";
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Charger l'état depuis localStorage au montage
  useEffect(() => {
    const saved = localStorage.getItem("sidebarOpen");
    if (saved !== null) {
      setSidebarOpen(saved === "true");
    }
  }, []);

  // Sauvegarder l'état dans localStorage
  useEffect(() => {
    localStorage.setItem("sidebarOpen", sidebarOpen.toString());
  }, [sidebarOpen]);

  const role = (user?.role || "").toString().toUpperCase();

  // Helper pour vérifier si un lien est actif
  const isActive = (href: string) => {
    if (pathname === href) return true;
    // Pour les routes parentes, vérifier si le pathname commence par le href
    if (href !== "/" && pathname.startsWith(href + "/")) return true;
    // Cas spécial pour la route racine
    if (href === "/" && pathname === "/") return true;
    return false;
  };

  const allLinks = [
    { href: "/admin", label: "Admin", section: "Général" },
    { href: "/manager", label: "Tableau de bord", section: "Général" },
    { href: "/pharmacie", label: "Pharmacie", section: "Modules" },
    { href: "/admin/rapports", label: "Rapports & Statistiques", section: "Modules" },
    { href: "/restaurant", label: "VILAKAZI", section: "Modules" },
    { href: "/restaurant/tables", label: "Gestion des tables", section: "Modules" },
    { href: "/restaurant/commandes", label: "Commandes Restaurant", section: "Modules" },
    { href: "/caisse/restaurant", label: "Caisse VILAKAZI", section: "Modules" },
    { href: "/caisse/restaurant/rapports", label: "Rapports Financiers", section: "Modules" },
    { href: "/caisse/bar", label: "Caisse BLACK & WHITE", section: "Modules" },
    { href: "/caisse/bar/rapports", label: "Rapports Financiers Bar", section: "Modules" },
    { href: "/caisse/location", label: "Caisse ACAJOU", section: "Modules" },
    { href: "/caisse/location/rapports", label: "Rapports Financiers Location", section: "Modules" },
    { href: "/bar", label: "BLACK & WHITE", section: "Modules" },
    { href: "/bar/commandes", label: "Commandes Bar", section: "Modules" },
    { href: "/location", label: "ACAJOU", section: "Modules" },
    { href: "/conseil", label: "Conseil d'Administration", section: "Administration" },
    { href: "/economat", label: "Économat", section: "Administration" },
    { href: "/superviseur", label: "Superviseur", section: "Administration" },
  ];

  function allowed(href: string) {
    if (role === "ADMIN") return true;
      if (role === "MANAGER_MULTI") {
        return ["/manager", "/restaurant", "/restaurant/tables", "/bar", "/bar/commandes", "/location", "/caisse/restaurant", "/caisse/restaurant/rapports", "/caisse/bar", "/caisse/bar/rapports", "/caisse/location", "/caisse/location/rapports"].includes(href);
      }
    if (role === "PHARMACIEN" || role === "GERANT_PHARMACIE") return ["/pharmacie", "/admin/rapports"].includes(href);
    if (role === "SERVEUR" || role === "GERANT_RESTAURANT") return ["/restaurant", "/restaurant/tables"].includes(href);
    if (role === "CAISSE_RESTAURANT") return ["/caisse/restaurant", "/caisse/restaurant/rapports", "/restaurant/commandes"].includes(href);
    if (role === "CAISSE_BAR") return ["/caisse/bar", "/caisse/bar/rapports", "/bar/commandes"].includes(href);
    if (role === "CAISSE_LOCATION") return ["/caisse/location", "/caisse/location/rapports"].includes(href);
    if (role === "BAR") return href === "/bar" || href === "/bar/commandes";
    if (role === "LOCATION") return href === "/location";
    if (role === "CONSEIL_ADMINISTRATION") return ["/conseil"].includes(href);
    if (role === "ECONOMAT") return ["/economat"].includes(href);
    if (role === "SUPERVISEUR") return ["/superviseur"].includes(href);
    return false;
  }

  const sections = Array.from(new Set(allLinks.map((l) => (l as any).section)));

  return (
    <div className="min-h-screen flex flex-col md:flex md:flex-row bg-gray-50">
      {/* SIDEBAR - Desktop avec toggle */}
      <aside
        className={`hidden md:flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${
          sidebarOpen ? "w-64" : "w-16"
        }`}
      >
        <div className="flex flex-col h-full p-4 md:p-6">
          {/* Header avec bouton toggle */}
          <div className="flex items-center justify-between gap-2 md:gap-3 mb-4 md:mb-6">
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              {sidebarOpen ? (
                <Logo size="md" showText={false} className="flex-shrink-0" />
              ) : (
                <Logo size="sm" showText={false} className="flex-shrink-0" />
              )}
              {sidebarOpen && (
                <div className="hidden md:block min-w-0 animate-in fade-in duration-300">
                  <div className="text-base md:text-lg font-semibold text-gray-900 truncate">VILAKAZI</div>
                  <div className="text-xs text-gray-500">Gestion Commerciale</div>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              aria-label={sidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {sidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                )}
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav aria-label="Navigation principale" className="flex-1 space-y-4 md:space-y-6 text-xs md:text-sm">
            {sections.map((section) => {
              const group = allLinks.filter((l) => (l as any).section === section && allowed(l.href));
              if (!group.length) return null;
              return (
                <div key={section}>
                  {sidebarOpen && (
                    <div className="px-1 text-xs font-semibold text-gray-400 uppercase mb-2 whitespace-nowrap overflow-hidden">
                      {section}
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    {group.map((l) => {
                      const active = isActive(l.href);
                      return (
                        <Link
                          key={l.href}
                          href={l.href}
                          className={`block rounded px-2 md:px-3 py-2 transition-colors ${
                            !sidebarOpen ? "flex items-center justify-center" : ""
                          } ${
                            active
                              ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600 font-semibold"
                              : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                          }`}
                          title={!sidebarOpen ? l.label : undefined}
                        >
                          {sidebarOpen ? (
                            <span className="whitespace-nowrap flex items-center gap-2">
                              {l.label}
                              {active && (
                                <svg
                                  className="w-4 h-4 ml-auto"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                >
                                  <path
                                    d="M9 6l6 6-6 6"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </span>
                          ) : (
                            <span className={`text-lg font-bold ${active ? "text-blue-600" : "text-gray-400"}`}>•</span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* SIDEBAR - Mobile drawer */}
      <div className="md:hidden p-4 bg-white border-b border-gray-200">
        <SidebarClient user={user} />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER avec bouton toggle */}
        <header className="h-14 md:h-16 flex items-center justify-between px-3 md:px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex items-center justify-center w-10 h-10 rounded-lg hover:bg-blue-500 transition-colors"
              aria-label={sidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {sidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <div className="font-semibold text-sm md:text-base">Tableau de bord</div>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            {/* Informations utilisateur */}
            <div className="hidden md:flex items-center gap-3 px-3 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm border-2 border-white/30">
                {user?.name
                  ? user.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                  : user?.email
                  ? user.email[0].toUpperCase()
                  : "U"}
              </div>
              <div className="flex flex-col">
                <div className="text-xs text-white/80">Connecté en tant que</div>
                <div className="text-sm font-semibold text-white truncate max-w-[200px]">
                  {user?.email || "Utilisateur"}
                </div>
                <div className="text-xs font-bold text-blue-200 uppercase mt-0.5">
                  {user?.role || ""}
                </div>
              </div>
            </div>
            {/* Version mobile simplifiée */}
            <div className="md:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xs border-2 border-white/30">
                {user?.email ? user.email[0].toUpperCase() : "U"}
              </div>
            </div>
            <LogoutButton />
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-3 md:p-6 bg-gray-50 overflow-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

