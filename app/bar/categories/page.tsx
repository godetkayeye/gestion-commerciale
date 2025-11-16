import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CategoriesClient from "./CategoriesClient";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR", "BAR", "MANAGER_MULTI"]);

export default async function CategoriesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  const items = await prisma.categories_boissons.findMany({ orderBy: { nom: "asc" }, include: { _count: { select: { boissons: true } } } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Catégories de boissons</h1>
      <CategoriesClient items={items} />
    </div>
  );
}

