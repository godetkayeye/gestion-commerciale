import { prisma } from "@/lib/prisma";
import TablesClient from "./TablesClient";

export default async function Page() {
  const tables = await prisma.table_restaurant.findMany({ orderBy: { numero: "asc" } });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des tables</h1>
          <p className="text-sm text-gray-500 mt-1">Créez et suivez l'état des tables (libre, occupée, en attente).</p>
        </div>
      </div>

      <TablesClient initialTables={tables} />
    </div>
  );
}
