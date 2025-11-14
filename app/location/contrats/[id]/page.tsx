import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { convertDecimalToNumber } from "@/lib/convertDecimal";
import ContratDetailClient from "./ContratDetailClient";

const allowed = new Set(["ADMIN", "LOCATION"]);

export default async function ContratDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  // Gérer le cas où params peut être une Promise (Next.js 15+)
  const resolvedParams = params instanceof Promise ? await params : params;
  const contratId = Number(resolvedParams.id);
  
  if (isNaN(contratId)) {
    redirect("/location/contrats");
  }

  const contratRaw = await prisma.contrats.findUnique({
    where: { id: contratId },
    include: {
      bien: true,
      locataire: true,
      paiements: {
        orderBy: {
          date_paiement: "desc"
        }
      }
    }
  });

  if (!contratRaw) {
    redirect("/location/contrats");
  }

  const contrat = convertDecimalToNumber(contratRaw);

  // Calculer le total des paiements
  const totalPaiements = contrat.paiements?.reduce((acc: number, p: any) => acc + Number(p.montant), 0) || 0;
  const totalPenalites = contrat.paiements?.reduce((acc: number, p: any) => acc + Number(p.penalite), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Contrat #{contrat.id}</h1>
        <div className="flex gap-2">
          <a
            href={`/api/exports/contrat-location/${contrat.id}`}
            target="_blank"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            Imprimer le contrat
          </a>
          <a
            href="/location/contrats"
            className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            ← Retour
          </a>
        </div>
      </div>

      <ContratDetailClient 
        contrat={contrat}
        totalPaiements={totalPaiements}
        totalPenalites={totalPenalites}
      />
    </div>
  );
}

