import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { convertDecimalToNumber } from "@/lib/convertDecimal";
import Link from "next/link";
import VentesPersonnelClient from "./VentesPersonnelClient";

const allowed = new Set(["ADMIN", "BAR", "MANAGER_MULTI"]);

export default async function VentesPersonnelPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  const resolvedParams = params instanceof Promise ? await params : params;
  const personnelId = Number(resolvedParams.id);

  if (isNaN(personnelId)) {
    redirect("/bar/personnel");
  }

  const [personnel, commandesRaw] = await Promise.all([
    prisma.personnel.findUnique({ where: { id: personnelId } }),
    prisma.commandes_bar.findMany({
      where: {
        serveur_id: personnelId,
        status: "VALIDEE" as any,
      },
      orderBy: { date_commande: "desc" },
      include: {
        table: true,
        details: {
          include: {
            boisson: true,
          },
        },
      },
    }),
  ]);

  if (!personnel) {
    redirect("/bar/personnel");
  }

  const commandes = convertDecimalToNumber(commandesRaw);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ventes — {personnel.nom}</h1>
          <p className="text-sm text-gray-600 mt-1">Historique des commandes validées</p>
        </div>
        <Link
          href="/bar/personnel"
          className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          ← Retour au personnel
        </Link>
      </div>
      <VentesPersonnelClient commandes={commandes} />
    </div>
  );
}

