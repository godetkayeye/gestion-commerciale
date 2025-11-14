import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDateRanges } from "@/lib/utils";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
    
    console.log("Processing stats request for date:", date);
    
    const { daily, weekly, monthly } = getDateRanges(new Date(date));
    
    console.log("Date ranges calculated:", {
      daily: { start: daily.start.toISOString(), end: daily.end.toISOString() },
      weekly: { start: weekly.start.toISOString(), end: weekly.end.toISOString() },
      monthly: { start: monthly.start.toISOString(), end: monthly.end.toISOString() },
    });

    // Get daily stats
    const dailyStats = await prisma.vente_pharmacie.aggregate({
      where: {
        date_vente: {
          gte: daily.start,
          lte: daily.end,
        },
      },
      _sum: {
        total: true,
      },
      _count: true,
    });

    // Get weekly stats
    const weeklyStats = await prisma.vente_pharmacie.aggregate({
      where: {
        date_vente: {
          gte: weekly.start,
          lte: weekly.end,
        },
      },
      _sum: {
        total: true,
      },
      _count: true,
    });

    // Get monthly stats
    const monthlyStats = await prisma.vente_pharmacie.aggregate({
      where: {
        date_vente: {
          gte: monthly.start,
          lte: monthly.end,
        },
      },
      _sum: {
        total: true,
      },
      _count: true,
    });

    // Get product stats for the selected date
    const productsStats = await prisma.details_vente_pharmacie.groupBy({
      by: ["medicament_id"],
      where: {
        vente: {
          date_vente: {
            gte: daily.start,
            lte: daily.end,
          },
        },
      },
      _sum: {
        quantite: true,
        prix_total: true,
      },
    });

    console.log("Products stats retrieved:", productsStats);

    type Medicament = {
      id: number;
      nom: string;
      prix_unitaire: number;
    };

    // Get product names
    const medicamentIds = productsStats
      .map((p: { medicament_id: number | null }) => p.medicament_id)
      .filter((id: number | null): id is number => id !== null);

    const medicaments = await prisma.medicament.findMany({
      where: {
        id: {
          in: medicamentIds,
        },
      },
      select: {
        id: true,
        nom: true,
        prix_unitaire: true,
      },
    });

    console.log("Found medicaments:", medicaments);

    type ProductStat = {
      medicament_id: number | null;
      _sum: {
        quantite: number | null;
        prix_total: Prisma.Decimal | null;
      } | null;
    };

    type ProductResult = {
      id: number;
      nom: string;
      quantite_vendue: number;
      total_ventes: number;
      benefice: number;
    };

    // Combine stats
    const products = productsStats
      .map((stat: ProductStat) => {
        const med = medicaments.find((m) => m.id === stat.medicament_id);
        if (!med || !stat._sum || !stat._sum.quantite || !stat._sum.prix_total || stat.medicament_id === null) return null;

        // Estimate profit as 20% of sales
        const totalSales = Number(stat._sum.prix_total);
        const estimatedProfit = totalSales * 0.20;

        return {
          id: stat.medicament_id,
          nom: med.nom,
          quantite_vendue: stat._sum.quantite,
          total_ventes: totalSales,
          benefice: estimatedProfit,
        };
      })
      .filter((product: ProductResult | null): product is ProductResult => product !== null)
      .sort((a: ProductResult, b: ProductResult) => b.total_ventes - a.total_ventes);

    // Calculate estimated profits (20% of sales) for each period
    const calculateProfit = async (startDate: Date, endDate: Date) => {
      const sales = await prisma.vente_pharmacie.aggregate({
        where: {
          date_vente: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          total: true,
        },
      });

      return Number(sales._sum?.total || 0) * 0.20;
    };

    const [dailyProfit, weeklyProfit, monthlyProfit] = await Promise.all([
      calculateProfit(daily.start, daily.end),
      calculateProfit(weekly.start, weekly.end),
      calculateProfit(monthly.start, monthly.end),
    ]);

    return NextResponse.json({
      daily: {
        total: Number(dailyStats._sum?.total || 0),
        benefice: dailyProfit,
        count: dailyStats._count,
      },
      weekly: {
        total: Number(weeklyStats._sum?.total || 0),
        benefice: weeklyProfit,
        count: weeklyStats._count,
      },
      monthly: {
        total: Number(monthlyStats._sum?.total || 0),
        benefice: monthlyProfit,
        count: monthlyStats._count,
      },
      products,
    });
  } catch (error) {
    console.error("Error fetching pharmacy stats:", error);
    
    // Check for specific error types
    if (error instanceof PrismaClientKnownRequestError) {
      console.error("Database error:", {
        code: error.code,
        message: error.message,
        meta: error.meta
      });
      return NextResponse.json(
        { 
          error: "Erreur de base de données", 
          details: `Code: ${error.code} - ${error.message}`
        },
        { status: 500 }
      );
    }

    // For other types of errors
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Detailed error:", errorMessage);
    
    return NextResponse.json(
      { 
        error: "Erreur lors du chargement des statistiques",
        details: errorMessage
      },
      { status: 500 }
    );
  }
}