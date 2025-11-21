import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { convertDecimalToNumber } from "@/lib/convertDecimal";
import BiensClient from "./BiensClient";

const allowed = new Set(["ADMIN", "LOCATION", "MANAGER_MULTI"]);

export default async function BiensPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  const itemsRaw = await prisma.biens.findMany({
    orderBy: [{ adresse: "asc" }, { id: "asc" }],
    take: 200,
  });
  const items = convertDecimalToNumber(itemsRaw);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Biens à louer</h1>
      <BiensClient items={items} />
    </div>
  );
}

