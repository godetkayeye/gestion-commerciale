import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { convertDecimalToNumber } from "@/lib/convertDecimal";
import EditBienClient from "./EditBienClient";

const allowed = new Set(["ADMIN", "LOCATION", "MANAGER_MULTI"]);

interface PageProps {
  params: { id: string };
}

export default async function BienDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) return redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) return redirect("/");

  const id = Number.parseInt(params.id, 10);
  if (Number.isNaN(id)) notFound();

  const bienRaw = await prisma.biens.findUnique({ where: { id } });
  if (!bienRaw) notFound();

  const bien = convertDecimalToNumber(bienRaw);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">ACAJOU — Biens à louer</p>
          <h1 className="text-2xl font-bold text-gray-900">Modifier le bien</h1>
          <p className="text-gray-600 text-sm">Mettez à jour les informations de {bien.nom || "ce bien"}.</p>
        </div>
        <Link
          href="/location/biens"
          className="inline-flex items-center px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition"
        >
          ← Retour à la liste
        </Link>
      </div>
      <EditBienClient bien={bien} />
    </div>
  );
}

