import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
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

  // Convertir les Decimal si nécessaire (via les contrats)
  const items = itemsRaw.map(item => ({
    ...item,
    contrats: item.contrats.map((c: any) => ({
      ...c,
      depot_garantie: c.depot_garantie ? Number(c.depot_garantie) : null,
      avance: c.avance ? Number(c.avance) : null,
      bien: c.bien ? {
        ...c.bien,
        prix_mensuel: c.bien.prix_mensuel ? Number(c.bien.prix_mensuel) : null,
      } : null
    }))
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Locataires</h1>
      <LocatairesClient items={items} />
    </div>
  );
}

