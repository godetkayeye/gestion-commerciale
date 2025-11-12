// Fonction utilitaire pour convertir les Decimal de Prisma en nombres
// Nécessaire car les objets Decimal ne peuvent pas être sérialisés pour les Client Components
export function convertDecimalToNumber(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'object') {
    // Vérifier si c'est un Decimal de Prisma (decimal.js)
    if (typeof obj.toNumber === 'function' || (obj.constructor && obj.constructor.name === 'Decimal')) {
      return typeof obj.toNumber === 'function' ? obj.toNumber() : Number(obj);
    }
    // Si c'est un tableau
    if (Array.isArray(obj)) {
      return obj.map(convertDecimalToNumber);
    }
    // Si c'est un objet, convertir récursivement
    const converted: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        converted[key] = convertDecimalToNumber(obj[key]);
      }
    }
    return converted;
  }
  return obj;
}

