"use client";

import RapportsClient from "./RapportsClient";

export default function RapportsPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold text-gray-900">Rapports & Statistiques</h1>
      <RapportsClient />
    </div>
  );
}