import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { convertDecimalToNumber } from "@/lib/convertDecimal";
import LocatairesClient from "./LocatairesClient";

const allowed = new Set(["ADMIN", "LOCATION", "MANAGER_MULTI"]);

export default async function LocatairesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  const itemsRaw = await prisma.locataires.findMany({ 
    orderBy: { nom: "asc" }, 
    take: 200,
    include: {
      contrats: {
        include: {
          bien: true
        },
        orderBy: {
          date_debut: "desc"
        }
      }
    }
  });

  // Convertir tous les Decimal en nombres pour la sérialisation
  const items = convertDecimalToNumber(itemsRaw);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Locataires</h1>
      <LocatairesClient items={items} />
    </div>
  );
}

