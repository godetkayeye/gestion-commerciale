export type MenuTemplateItem = {
  name: string;
  price: number;
  note?: string;
};

export type MenuTemplateSection = {
  key: string;
  label: string;
  description?: string;
  defaultCategoryName: string;
  items: MenuTemplateItem[];
};

export const MENU_TEMPLATE_SECTIONS: MenuTemplateSection[] = [
  {
    key: "ENTREES",
    label: "Entrées",
    defaultCategoryName: "Entrées",
    description: "Classiques à partager inspirés du menu papier fourni.",
    items: [
      { name: "Ailes de poulet", price: 15 },
      { name: "Chenilles", price: 15 },
      { name: "Gésiers pimentés", price: 15 },
      { name: "Mposé au poivron 3 couleurs", price: 15 },
    ],
  },
  {
    key: "SALADES",
    label: "Salades",
    defaultCategoryName: "Salades",
    items: [
      { name: "Kinzi Kinzi", price: 15 },
      { name: "Salade mixte", price: 15 },
    ],
  },
  {
    key: "PATES",
    label: "Pâtes",
    defaultCategoryName: "Pâtes",
    items: [
      { name: "Penne Carbonara", price: 15 },
      { name: "Spaghetti Bolognaise", price: 15 },
    ],
  },
  {
    key: "PLATS",
    label: "Plats signature",
    defaultCategoryName: "Plats",
    description: "Recettes principales à base de poulet, boeuf ou poisson.",
    items: [
      { name: "Poulet DG", price: 25 },
      { name: "Poulet Yassa", price: 25 },
      { name: "Thieb Yapp (boeuf)", price: 27 },
      { name: "Mafé Poulet/Bœuf", price: 27 },
      { name: "Thiebou Diene (poisson)", price: 27 },
      { name: "Tajine de poulet / boeuf", price: 25 },
    ],
  },
  {
    key: "SAUCE",
    label: "À la sauce",
    defaultCategoryName: "À la sauce",
    items: [
      { name: "Mouton à la sauce", price: 20 },
      { name: "Porc à la sauce", price: 20 },
      { name: "Chèvre à la sauce", price: 20 },
      { name: "Poulet à la sauce", price: 25 },
    ],
  },
  {
    key: "PECHEURS",
    label: "Les pêcheurs",
    defaultCategoryName: "Les pêcheurs",
    items: [
      { name: "Assiette du pêcheur", price: 30 },
      { name: "Marmite du pêcheur", price: 35 },
      { name: "Poisson à l'étouffé", price: 30 },
    ],
  },
  {
    key: "DESSERTS",
    label: "Desserts",
    defaultCategoryName: "Desserts",
    description: "Sélection gourmande (prix unique 7 $).",
    items: [
      { name: "Noir de Noir", price: 7 },
      { name: "Blanc Speculoos", price: 7 },
      { name: "Chocolait", price: 7 },
      { name: "Caramel beurre salé", price: 7 },
      { name: "Choco caramel", price: 7 },
      { name: "Oreo cookie n'cream", price: 7 },
      { name: "Passion", price: 7 },
      { name: "Fruits rouges", price: 7 },
      { name: "New York cheesecake", price: 7 },
      { name: "Cheesecake framboise", price: 7 },
      { name: "Coco citron meringue", price: 7 },
    ],
  },
];

export const REQUIRED_REPAS_CATEGORIES = Array.from(
  new Set(MENU_TEMPLATE_SECTIONS.map((section) => section.defaultCategoryName)),
);


