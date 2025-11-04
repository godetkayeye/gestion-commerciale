import Link from "next/link";
import SidebarClient from "./SidebarClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr] grid-rows-[56px_1fr]" style={{ gridTemplateAreas: `'sidebar header' 'sidebar main'` }}>
      <aside className="row-span-2 p-4 bg-white border-r border-gray-200" style={{ gridArea: "sidebar" }}>
        {/* Sidebar client for active links and responsive toggle */}
        {/* @ts-expect-error Server->Client prop serialization OK for small user object */}
        <SidebarClient user={{ email: session.user?.email, name: session.user?.name, role: session.user?.role }} />
      </aside>
      <header className="h-14 flex items-center justify-between px-4 bg-blue-600 text-white" style={{ gridArea: "header" }}>
        <div className="flex items-center gap-4">
          <div className="font-medium">Tableau de bord</div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <input placeholder="Rechercher..." className="px-3 py-1.5 rounded-md text-sm text-gray-700" />
          </div>
          <div className="text-sm opacity-90">{session.user?.email}</div>
        </div>
      </header>
      <main className="p-6 bg-gray-50" style={{ gridArea: "main" }}>
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}


