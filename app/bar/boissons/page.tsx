import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BoissonsClient from "./BoissonsClient";
import { convertDecimalToNumber } from "@/lib/convertDecimal";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR", "BAR"]);

export default async function BoissonsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  const itemsRaw = await prisma.boissons.findMany({ orderBy: { nom: "asc" }, take: 200, include: { categorie: true } });
  const items = convertDecimalToNumber(itemsRaw);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Boissons</h1>
      <BoissonsClient items={items} />
    </div>
  );
}

