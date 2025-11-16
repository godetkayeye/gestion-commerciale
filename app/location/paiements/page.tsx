import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { convertDecimalToNumber } from "@/lib/convertDecimal";
import PaiementsClient from "./PaiementsClient";

const allowed = new Set(["ADMIN", "LOCATION", "MANAGER_MULTI"]);

export default async function PaiementsLocationPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  const itemsRaw = await prisma.paiements_location.findMany({ 
    orderBy: { date_paiement: "desc" }, 
    take: 200, 
    include: { 
      contrat: { 
        include: { 
          bien: true, 
          locataire: true 
        } 
      } 
    } 
  });
  const items = convertDecimalToNumber(itemsRaw);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Gestion des Paiements</h1>
      <PaiementsClient items={items} />
    </div>
  );
}

