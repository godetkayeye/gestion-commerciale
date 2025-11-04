import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductsClient from "./ProductsClient";

const allowed = new Set(["ADMIN", "GERANT_PHARMACIE", "CAISSIER", "PHARMACIEN"]);

export default async function ProduitsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  const produits = await prisma.medicament.findMany({ orderBy: { nom: "asc" }, take: 100 });

  const serializable = produits.map((p) => ({
    id: p.id,
    nom: p.nom,
    prix_unitaire: Number(p.prix_unitaire),
    quantite_stock: p.quantite_stock,
    date_expiration: p.date_expiration ? p.date_expiration.toISOString() : null,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Produits (Pharmacie)</h1>
      <ProductsClient initial={serializable} userRole={session.user.role} />
    </div>
  );
}


