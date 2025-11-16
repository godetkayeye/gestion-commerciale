import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { convertDecimalToNumber } from "@/lib/convertDecimal";
import ContratsClient from "./ContratsClient";

const allowed = new Set(["ADMIN", "LOCATION", "MANAGER_MULTI"]);

export default async function ContratsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  const itemsRaw = await prisma.contrats.findMany({ 
    orderBy: { date_debut: "desc" }, 
    take: 100, 
    include: { 
      bien: true, 
      locataire: true 
    } 
  });
  const items = convertDecimalToNumber(itemsRaw);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Gestion des Contrats</h1>
      <ContratsClient items={items} />
    </div>
  );
}

