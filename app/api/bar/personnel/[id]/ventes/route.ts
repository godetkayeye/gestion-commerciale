import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { convertDecimalToNumber } from "@/lib/convertDecimal";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const id = Number(resolvedParams.id);
  
  // Récupérer les commandes validées du personnel
  const commandes = await prisma.commandes_bar.findMany({
    where: { 
      serveur_id: id,
      status: "VALIDEE"
    },
    include: {
      details: {
        include: {
          boisson: true
        }
      },
      facture: true
    },
    orderBy: { date_commande: "desc" }
  });

  // Calculer le total des ventes
  let totalVentes = 0;
  const ventesAvecDetails = commandes.map(c => {
    const totalCommande = c.details.reduce((sum, d) => sum + Number(d.prix_total), 0);
    totalVentes += totalCommande;
    return {
      ...c,
      total: totalCommande
    };
  });

  return NextResponse.json(convertDecimalToNumber({
    commandes: ventesAvecDetails,
    totalVentes,
    nombreCommandes: commandes.length
  }));
}

