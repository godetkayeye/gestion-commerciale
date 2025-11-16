import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { convertDecimalToNumber } from "@/lib/convertDecimal";
import HistoriqueLocataireClient from "./HistoriqueLocataireClient";

const allowed = new Set(["ADMIN", "LOCATION", "MANAGER_MULTI"]);

export default async function HistoriqueLocatairePage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  // Gérer le cas où params peut être une Promise (Next.js 15+)
  const resolvedParams = params instanceof Promise ? await params : params;
  const locataireId = Number(resolvedParams.id);
  
  if (isNaN(locataireId)) {
    redirect("/location/locataires");
  }

  const locataire = await prisma.locataires.findUnique({ 
    where: { id: locataireId },
    include: {
      contrats: {
        include: {
          bien: true,
          paiements: {
            orderBy: {
              date_paiement: "desc"
            }
          }
        },
        orderBy: {
          date_debut: "desc"
        }
      }
    }
  });
  
  if (!locataire) {
    redirect("/location/locataires");
  }

  // Convertir les Decimal
  const locataireConverted = convertDecimalToNumber(locataire);

  // Déterminer le statut du locataire
  const contratsActifs = locataire.contrats.filter((c: any) => c.statut === "ACTIF");
  const statut = contratsActifs.length > 0 ? "Actif" : 
                 locataire.contrats.length > 0 ? "Ancien" : "En attente";

  // Convertir les Decimal dans les paiements
  const locataireWithConvertedPaiements = {
    ...locataireConverted,
    contrats: locataireConverted.contrats.map((c: any) => ({
      ...c,
      paiements: c.paiements?.map((p: any) => ({
        ...p,
        montant: p.montant ? Number(p.montant) : 0,
        reste_du: p.reste_du ? Number(p.reste_du) : 0,
        penalite: p.penalite ? Number(p.penalite) : 0,
      })) || []
    }))
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historique de {locataire.nom}</h1>
          <p className="text-sm text-gray-600 mt-1">
            Statut: <span className="font-medium">{statut}</span>
          </p>
        </div>
        <a
          href="/location/locataires"
          className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          ← Retour
        </a>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Contact</p>
            <p className="text-sm font-medium text-gray-900">{locataire.contact || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Profession</p>
            <p className="text-sm font-medium text-gray-900">{locataire.profession || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Pièce d'identité</p>
            <p className="text-sm font-medium text-gray-900">{locataire.piece_identite || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Nombre de contrats</p>
            <p className="text-sm font-medium text-gray-900">{locataire.contrats.length}</p>
          </div>
        </div>
      </div>

      <HistoriqueLocataireClient locataire={locataireWithConvertedPaiements} />
    </div>
  );
}

