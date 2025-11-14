import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { convertDecimalToNumber } from "@/lib/convertDecimal";
import VentesPersonnelClient from "./VentesPersonnelClient";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR", "BAR"]);

export default async function VentesPersonnelPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  const resolved = params instanceof Promise ? await params : params;
  const idNum = Number(resolved.id);
  if (isNaN(idNum)) redirect("/bar/personnel");

  const personnel = await prisma.personnel.findUnique({ where: { id: idNum } });
  if (!personnel) redirect("/bar/personnel");

  const commandesRaw = await prisma.commandes_bar.findMany({
    where: { serveur_id: idNum, status: "VALIDEE" },
    include: {
      details: { include: { boisson: true } },
      table: true,
    },
    orderBy: { date_commande: "desc" },
  });

  const commandes = convertDecimalToNumber(commandesRaw);
  const totalVentes = commandes.reduce((sum: number, c: any) => sum + (c.details?.reduce((s: number, d: any) => s + Number(d.prix_total || 0), 0) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ventes de {personnel.nom}</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Nombre de commandes</div>
          <div className="mt-1 text-xl font-semibold text-gray-900">{commandes.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Total des ventes</div>
          <div className="mt-1 text-xl font-semibold text-gray-900">{Number(totalVentes).toLocaleString()} FC</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600">Rôle</div>
          <div className="mt-1 text-xl font-semibold text-gray-900">{personnel.role}</div>
        </div>
      </div>

      <VentesPersonnelClient commandes={commandes} />
    </div>
  );
}
