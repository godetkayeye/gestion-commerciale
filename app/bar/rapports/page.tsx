import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { convertDecimalToNumber } from "@/lib/convertDecimal";
import RapportsClient from "./RapportsClient";

const allowed = new Set(["ADMIN", "GERANT_RESTAURANT", "SERVEUR", "BAR", "MANAGER_MULTI"]);

export default async function RapportsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (!session.user?.role || !allowed.has(session.user.role)) redirect("/");

  // Calculer les dates
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const semainePassee = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const debutMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1);

  // Chiffre d'affaires
  const [caJour, caSemaine, caMois] = await Promise.all([
    prisma.factures.aggregate({
      _sum: { total: true },
      where: { date_facture: { gte: aujourdhui } }
    }),
    prisma.factures.aggregate({
      _sum: { total: true },
      where: { date_facture: { gte: semainePassee } }
    }),
    prisma.factures.aggregate({
      _sum: { total: true },
      where: { date_facture: { gte: debutMois } }
    })
  ]);

  // Boissons les plus vendues (depuis le début du mois)
  const boissonsVenduesRaw = await prisma.commande_details.groupBy({
    by: ['boisson_id'],
    where: {
      commande: {
        status: 'VALIDEE',
        date_commande: { gte: debutMois }
      }
    },
    _sum: {
      quantite: true,
      prix_total: true
    },
    orderBy: {
      _sum: {
        quantite: 'desc'
      }
    },
    take: 10
  });

  // Récupérer les détails des boissons
  const boissonIds = boissonsVenduesRaw.map(b => b.boisson_id).filter((id): id is number => id !== null);
  const boissons = await prisma.boissons.findMany({
    where: { id: { in: boissonIds } }
  });

  const boissonsVendues = boissonsVenduesRaw.map(bv => {
    const boisson = boissons.find(b => b.id === bv.boisson_id);
    return {
      boisson_id: bv.boisson_id,
      nom: boisson?.nom || "Boisson inconnue",
      quantite_vendue: bv._sum.quantite || 0,
      chiffre_affaires: bv._sum.prix_total || 0
    };
  });

  // Serveurs les plus performants (depuis le début du mois)
  const serveursPerformantsRaw = await prisma.commandes_bar.groupBy({
    by: ['serveur_id'],
    where: {
      status: 'VALIDEE',
      date_commande: { gte: debutMois },
      serveur_id: { not: null }
    },
    _count: {
      id: true
    }
  });

  // Calculer le CA par serveur
  const serveursAvecCA = await Promise.all(
    serveursPerformantsRaw.map(async (s) => {
      const commandes = await prisma.commandes_bar.findMany({
        where: {
          serveur_id: s.serveur_id,
          status: 'VALIDEE',
          date_commande: { gte: debutMois }
        },
        include: {
          details: true,
          serveur: true
        }
      });

      const ca = commandes.reduce((acc, cmd) => {
        return acc + cmd.details.reduce((sum, d) => sum + Number(d.prix_total), 0);
      }, 0);

      return {
        serveur_id: s.serveur_id,
        nom: commandes[0]?.serveur?.nom || "Serveur inconnu",
        nombre_commandes: s._count.id,
        chiffre_affaires: ca
      };
    })
  );

  const serveursPerformants = serveursAvecCA
    .sort((a, b) => b.chiffre_affaires - a.chiffre_affaires)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Rapports & Statistiques</h1>
        <a
          href="/bar"
          className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          ← Retour au tableau de bord
        </a>
      </div>

      <RapportsClient
        caJour={Number(caJour._sum.total ?? 0)}
        caSemaine={Number(caSemaine._sum.total ?? 0)}
        caMois={Number(caMois._sum.total ?? 0)}
        boissonsVendues={convertDecimalToNumber(boissonsVendues)}
        serveursPerformants={convertDecimalToNumber(serveursPerformants)}
      />
    </div>
  );
}

