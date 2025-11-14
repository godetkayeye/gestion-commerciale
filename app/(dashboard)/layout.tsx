import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LogoutButton from "@/app/components/LogoutButton";
import SidebarClient from "./SidebarClient";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  return (
    <div className="min-h-screen flex flex-col md:grid md:grid-cols-[260px_1fr] md:grid-rows-[64px_1fr] bg-gray-50" style={{ gridTemplateAreas: `'sidebar header' 'sidebar main'` }}>
      {/* SIDEBAR - Mobile drawer + Desktop sidebar */}
      <div className="md:col-span-1 md:row-span-2" style={{ gridArea: "sidebar" }}>
        <div className="hidden md:flex flex-col h-full p-4 md:p-6 bg-white border-r border-gray-200">
          {/* Desktop sidebar content */}
          <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm md:text-lg font-bold">GC</div>
            <div className="hidden md:block">
              <div className="text-base md:text-lg font-semibold text-gray-900">Gestion Commerciale</div>
              <div className="text-xs text-gray-500">Backoffice</div>
            </div>
          </div>

          <nav aria-label="Navigation principale" className="flex-1 space-y-4 md:space-y-6 text-xs md:text-sm">
            {
              (() => {
                const role = (session.user?.role || "").toString().toUpperCase();
                const allLinks = [
                  { href: "/admin", label: "Admin", section: 'Général' },
                  { href: "/pharmacie", label: "Pharmacie", section: 'Modules' },
                  { href: "/admin/rapports", label: "Rapports & Statistiques", section: 'Modules' },
                  { href: "/restaurant", label: "Restaurant", section: 'Modules' },
                  { href: "/restaurant/tables", label: "Gestion des tables", section: 'Modules' },
                  { href: "/bar", label: "Bar / Terrasse", section: 'Modules' },
                  { href: "/location", label: "Location", section: 'Modules' },
                ];

                function allowed(href: string) {
                  if (role === "ADMIN") return true;
                  if (role === "PHARMACIEN" || role === "GERANT_PHARMACIE") return ["/pharmacie", "/admin/rapports"].includes(href);
                  if (role === "SERVEUR" || role === "GERANT_RESTAURANT") return ["/restaurant", "/restaurant/tables"].includes(href);
                  if (role === "BAR") return href === "/bar";
                  if (role === "LOCATION") return href === "/location";
                  return false;
                }

                // group by section for nicer layout
                const sections = Array.from(new Set(allLinks.map(l => (l as any).section)));

                return sections.map((section) => {
                  const group = allLinks.filter(l => (l as any).section === section && allowed(l.href));
                  if (!group.length) return null;
                  return (
                    <div key={section}>
                      <div className="px-1 text-xs font-semibold text-gray-400 uppercase mb-2">{section}</div>
                      <div className="flex flex-col gap-1">
                        {group.map(l => (
                          <Link key={l.href} href={l.href} className="block rounded px-2 md:px-3 py-2 hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition-colors">{l.label}</Link>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()
            }
          </nav>

          <div className="mt-auto pt-3 md:pt-4 border-t text-xs text-gray-600">
            <div className="mb-1">Connecté en tant que</div>
            <div className="font-medium truncate text-gray-900">{session.user?.email}</div>
            <div className="text-blue-600 text-xs font-semibold uppercase mt-1">{session.user?.role}</div>
            <div className="mt-3">
              <LogoutButton />
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Client */}
        <div className="md:hidden p-4 bg-white border-b border-gray-200">
          <SidebarClient user={session.user} />
        </div>
      </div>

      {/* HEADER */}
      <header className="h-12 md:h-14 flex items-center justify-between px-3 md:px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm" style={{ gridArea: "header" }}>
        <div className="font-semibold text-sm md:text-base">Tableau de bord</div>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="text-xs md:text-sm opacity-90 hidden sm:block">{session.user?.email}</div>
          <LogoutButton />
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-3 md:p-6 bg-gray-50" style={{ gridArea: "main" }}>
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}


