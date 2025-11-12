import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import LogoutButton from "@/app/components/LogoutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr] grid-rows-[56px_1fr]" style={{ gridTemplateAreas: `'sidebar header' 'sidebar main'` }}>
      <aside className="row-span-2 p-4 bg-white border-r border-gray-200 flex flex-col" style={{ gridArea: "sidebar" }}>
        <div className="text-xl font-semibold text-blue-700 mb-6">Gestion</div>
        <nav className="space-y-2 text-sm flex-1">
          <Link className="block rounded px-3 py-2 bg-blue-100 text-blue-700 font-medium" href="/admin">☆ Admin</Link>
          <Link className="block rounded px-3 py-2 hover:bg-blue-50 text-gray-700" href="/pharmacie">➕ Pharmacie</Link>
          <Link className="block rounded px-3 py-2 hover:bg-blue-50 text-gray-700" href="/admin/rapports">📊 Rapports & Statistiques</Link>
          <Link className="block rounded px-3 py-2 hover:bg-blue-50 text-gray-700" href="/restaurant">☰ Restaurant</Link>
          <Link className="block rounded px-3 py-2 hover:bg-blue-50 text-gray-700" href="/restaurant/tables">🗄️ Gestion des tables</Link>
          <Link className="block rounded px-3 py-2 hover:bg-blue-50 text-gray-700" href="/bar">🍺 Bar / Terrasse</Link>
          <Link className="block rounded px-3 py-2 hover:bg-blue-50 text-gray-700" href="/location">🏠 Location</Link>
        </nav>
        <div className="mt-auto pt-4 border-t text-xs text-gray-600">
          <div>Connecté en tant que</div>
          <div className="font-medium">{session.user?.email}</div>
          <div className="text-blue-600">{session.user?.role}</div>
        </div>
      </aside>
      <header className="h-14 flex items-center justify-between px-4 bg-blue-600 text-white" style={{ gridArea: "header" }}>
        <div className="font-medium">Tableau de bord</div>
        <div className="flex items-center gap-4">
          <div className="text-sm opacity-90">{session.user?.email}</div>
          <LogoutButton />
        </div>
      </header>
      <main className="p-6 bg-gray-50" style={{ gridArea: "main" }}>
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}


