import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import CommandesClient from "./CommandesClient";
import { prisma } from "@/lib/prisma";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR", "CAISSIER"]);

export default async function CommandesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  const commandes = await prisma.commande.findMany({ orderBy: { date_commande: "desc" }, take: 100 });

  // serialize commandes for client
  const initial = commandes.map((c) => ({ id: c.id, table_numero: c.table_numero ?? null, statut: c.statut ?? null, total: c.total !== null && c.total !== undefined ? Number(c.total) : null }));

  return (
    <div className="space-y-6">
      <CommandesClient initial={initial} />
    </div>
  );
}


