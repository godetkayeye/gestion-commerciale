import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

// NB: le rôle COMPTABLE n'existe pas encore dans la base. À ajouter plus tard.
const allowed = new Set(["ADMIN"]);

export default async function ComptablePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Comptabilité — Rapports</h1>
      <p className="mt-2 text-sm text-gray-600">Accès aux ventes et statistiques.</p>
    </div>
  );
}


