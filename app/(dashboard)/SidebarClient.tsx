"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import LogoutButton from "@/app/components/LogoutButton";

type User = { email?: string | null; name?: string | null; role?: string | null };

export default function SidebarClient({ user }: { user?: User }) {
  const pathname = usePathname() || "/";
  const [open, setIsOpen] = useState(false);

  const links = [
    { href: "/admin", label: "Admin", section: "Général" },
    { href: "/pharmacie", label: "Pharmacie", section: "Modules" },
    { href: "/admin/rapports", label: "Rapports & Statistiques", section: "Modules" },
    { href: "/restaurant", label: "Restaurant", section: "Modules" },
    { href: "/restaurant/tables", label: "Gestion des tables", section: "Modules" },
    { href: "/bar", label: "Bar / Terrasse", section: "Modules" },
    { href: "/location", label: "Location", section: "Modules" },
  ];

  // determine allowed links based on role
  const role = (user?.role || "").toString().toUpperCase();

  function isAllowed(href: string) {
    if (role === "ADMIN") return true;
    if (role === "PHARMACIEN" || role === "GERANT_PHARMACIE") return ["/pharmacie", "/admin/rapports"].includes(href);
    if (role === "SERVEUR" || role === "GERANT_RESTAURANT") return ["/restaurant", "/restaurant/tables"].includes(href);
    if (role === "BAR") return href === "/bar";
    if (role === "LOCATION") return href === "/location";
    return false;
  }

  // helper for active link
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!open)}
        className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Toggle navigation menu"
        aria-expanded={open}
      >
        <svg
          className="w-6 h-6 text-gray-900"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
          />
        </svg>
      </button>

      {/* Mobile Sidebar Drawer */}
      {open && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-30 bg-black/40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="fixed left-0 top-0 h-screen w-80 z-40 bg-white shadow-lg flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                  GC
                </div>
                <div className="text-sm font-semibold text-gray-900">Gestion Commerciale</div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close navigation menu"
              >
                <svg
                  className="w-6 h-6 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Navigation */}
            <nav aria-label="Navigation principale" className="flex-1 p-4 space-y-4 overflow-y-auto">
              {["Général", "Modules"].map((section) => {
                const group = links.filter((l) => (l as any).section === section);
                const visible = group.some((g) => isAllowed(g.href));
                if (!visible) return null;

                return (
                  <div key={section}>
                    <div className="px-2 text-xs font-semibold text-gray-400 uppercase mb-2">
                      {section}
                    </div>
                    <div className="space-y-1">
                      {group
                        .filter((g) => isAllowed(g.href))
                        .map((l) => {
                          const active = isActive(l.href);
                          return (
                            <Link
                              key={l.href}
                              href={l.href}
                              onClick={() => setIsOpen(false)}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm ${
                                active
                                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
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
                            </Link>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* User Info & Logout */}
            <div className="p-4 border-t border-gray-200 space-y-3">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
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
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {user?.email || "Utilisateur"}
                  </div>
                  <div className="text-xs text-blue-600 font-semibold uppercase">
                    {user?.role || ""}
                  </div>
                </div>
              </div>
              <LogoutButton />
            </div>
          </div>
        </>
      )}
    </>
  );
}
