"use client";

import { useState, useEffect } from "react";

/**
 * Hook React pour récupérer le taux de change côté client
 * Fait un appel API pour récupérer le taux depuis la base de données
 */
export function useTauxChange(): { tauxChange: number; loading: boolean; error: string | null } {
  const [tauxChange, setTauxChange] = useState<number>(2200);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTauxChange = async () => {
      try {
        const res = await fetch("/api/manager/taux-change");
        const data = await res.json();
        if (res.ok && data.taux_change) {
          setTauxChange(Number(data.taux_change));
        } else {
          // Utiliser la valeur par défaut en cas d'erreur
          setTauxChange(2200);
        }
      } catch (err: any) {
        console.warn("[useTauxChange] Erreur:", err?.message);
        setError(err?.message || "Erreur lors du chargement du taux");
        // Utiliser la valeur par défaut en cas d'erreur
        setTauxChange(2200);
      } finally {
        setLoading(false);
      }
    };

    fetchTauxChange();
  }, []);

  return { tauxChange, loading, error };
}

