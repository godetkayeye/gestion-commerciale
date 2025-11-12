"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ModalCategorie from "./ModalCategorie";

interface CategoriesClientProps {
  items: any[];
}

export default function CategoriesClient({ items }: CategoriesClientProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const handleRefresh = () => {
    router.refresh();
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette catégorie ?")) return;
    const res = await fetch(`/api/bar/categories/${id}`, { method: "DELETE" });
    if (res.ok) handleRefresh();
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Liste des catégories</h2>
          <button
            onClick={() => {
              setEditingItem(null);
              setModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            + Nouvelle catégorie
          </button>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-blue-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Nom</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Nombre de boissons</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((c, idx) => (
                <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="p-4">
                    <span className="font-medium text-gray-900">{c.nom}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-800 font-medium">{c._count?.boissons ?? 0}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(c)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                      >
                        Éditer
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-red-600 hover:text-red-800 font-medium text-sm hover:underline"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              Aucune catégorie enregistrée. Cliquez sur "Nouvelle catégorie" pour commencer.
            </div>
          )}
        </div>
      </div>

      <ModalCategorie
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSuccess={handleRefresh}
        item={editingItem}
      />
    </>
  );
}

