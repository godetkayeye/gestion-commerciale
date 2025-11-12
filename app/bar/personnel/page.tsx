import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PersonnelClient from "./PersonnelClient";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR"]);

export default async function PersonnelPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  const items = await prisma.personnel.findMany({ orderBy: { nom: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Gestion du Personnel</h1>
      <PersonnelClient items={items} />
    </div>
  );
}

