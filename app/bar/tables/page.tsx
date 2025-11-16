import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TablesClient from "./TablesClient";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR", "BAR", "MANAGER_MULTI"]);

export default async function TablesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  const items = await prisma.tables_service.findMany({ orderBy: { nom: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tables / Zones de service</h1>
      <TablesClient items={items} />
    </div>
  );
}

