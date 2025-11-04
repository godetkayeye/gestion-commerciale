import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import VentesClient from "./VentesClient";

const allowed = new Set(["ADMIN", "GERANT_PHARMACIE", "CAISSIER", "PHARMACIEN"]);

export default async function VentesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  const ventes = await prisma.vente_pharmacie.findMany({ orderBy: { date_vente: "desc" }, take: 100, include: { details: { include: { medicament: true } } } });

  const serializable = ventes.map((v) => ({
    id: v.id,
    date_vente: v.date_vente ? v.date_vente.toISOString() : null,
    total: Number(v.total ?? 0),
    details: (v.details || []).map((d) => ({
      id: d.id,
      quantite: Number(d.quantite),
      prix_total: Number(d.prix_total ?? 0),
      medicament: d.medicament ? { id: d.medicament.id, nom: d.medicament.nom } : null,
    })),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Ventes (Pharmacie)</h1>
      <VentesClient initial={serializable} userRole={session.user.role} />
    </div>
  );
}


