import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import CommissionsClient from "./CommissionsClient";

const allowed = new Set(["ADMIN", "BAR", "MANAGER_MULTI"]);

export default async function CommissionsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Commissions</h1>
        <a
          href="/bar"
          className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          ← Retour au tableau de bord
        </a>
      </div>
      <CommissionsClient />
    </div>
  );
}
