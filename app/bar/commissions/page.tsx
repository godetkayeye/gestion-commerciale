import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import CommissionsClient from "./CommissionsClient";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "BAR"]);

export default async function CommissionsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Commissions</h1>
      <CommissionsClient />
    </div>
  );
}
