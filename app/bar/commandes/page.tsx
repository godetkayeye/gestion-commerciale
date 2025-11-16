import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CommandesClient from "./CommandesClient";
import { convertDecimalToNumber } from "@/lib/convertDecimal";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR", "CAISSE_BAR", "CAISSIER", "BAR", "MANAGER_MULTI"]);

export default async function CommandesBarPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  const commandesRaw = await prisma.commandes_bar.findMany({ 
    orderBy: { date_commande: "desc" }, 
    take: 100, 
    include: { 
      table: true, 
      serveur: true,
      details: { include: { boisson: true } }
    } 
  });
  const commandes = convertDecimalToNumber(commandesRaw);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Commandes Bar</h1>
      <CommandesClient commandes={commandes} />
    </div>
  );
}

