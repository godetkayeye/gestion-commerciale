import { prisma } from "./prisma";

/**
 * Récupère le taux de change depuis la table configuration
 * Retourne 2200 par défaut si la table n'existe pas ou si la clé n'est pas trouvée
 */
export async function getTauxChange(): Promise<number> {
  try {
    const config = await prisma.configuration.findUnique({
      where: { cle: "taux_change" },
    });
    
    if (config && config.valeur) {
      const taux = Number(config.valeur);
      if (!isNaN(taux) && taux > 0) {
        return taux;
      }
    }
    
    // Valeur par défaut si pas configuré
    return 2200;
  } catch (error: any) {
    // Si la table n'existe pas ou autre erreur, retourner la valeur par défaut
    console.warn("[getTauxChange] Erreur lors de la récupération du taux:", error?.message);
    return 2200;
  }
}

