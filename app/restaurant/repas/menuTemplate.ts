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
  {
    key: "GRILLADES",
    label: "Grillades",
    defaultCategoryName: "GRILLADES",
    description: "Toutes nos viandes sont désossées",
    items: [
      { name: "Mouton braisé (1 Kg)", price: 45 },
      { name: "Mouton braisé (Demi)", price: 25 },
      { name: "Porc braisé (1 Kg)", price: 35 },
      { name: "Porc braisé (Demi)", price: 20 },
      { name: "Chèvre braisé (1 Kg)", price: 45 },
      { name: "Chèvre braisé (Demi)", price: 25 },
      { name: "Poulet braisé (entier)", price: 25 },
      { name: "Croupion de dinde braisé (500g)", price: 15 },
      { name: "Coupés-coupés (500g)", price: 20 },
      { name: "Picanha (1kg)", price: 45 },
      { name: "Petit salé (1kg)", price: 45 },
    ],
  },
  {
    key: "PLAISIRS_PARTAGER",
    label: "Les plaisirs à partager",
    defaultCategoryName: "LES PLAISIRS À PARTAGER",
    items: [
      { name: "Porc ou Bœuf (500g + Accompagnement)", price: 20 },
      { name: "Porc ou Bœuf (1kg + Accompagnement)", price: 30 },
    ],
  },
  {
    key: "SUPPLEMENTS",
    label: "Suppléments",
    defaultCategoryName: "SUPPLEMENTS",
    items: [
      { name: "Sauce Yassa", price: 6 },
      { name: "Sauce Mafé", price: 6 },
      { name: "Mayo", price: 3 },
    ],
  },
  {
    key: "LEGUMES",
    label: "Légumes",
    defaultCategoryName: "LÉGUMES",
    items: [
      { name: "Pondu", price: 5 },
      { name: "Amarante", price: 7 },
      { name: "Épinards", price: 10 },
      { name: "Gombo", price: 7 },
      { name: "Haricots", price: 6 },
      { name: "Egusi", price: 12 },
    ],
  },
  {
    key: "ACCOMPAGNEMENTS",
    label: "Accompagnements",
    defaultCategoryName: "ACCOMPAGNEMENTS",
    items: [
      { name: "Makemba", price: 5 },
      { name: "Chikwangue", price: 3 },
      { name: "Riz blanc / jaune", price: 5 },
      { name: "Riz Jollof", price: 5 },
      { name: "Attiéké", price: 7 },
      { name: "Pommes de terre sautées", price: 7 },
      { name: "Semoules", price: 5 },
      { name: "Frites", price: 5 },
    ],
  },
  {
    key: "RIZ_SPECIAL",
    label: "Riz spécial",
    defaultCategoryName: "RIZ SPÉCIAL",
    items: [
      { name: "Riz poulet ananas", price: 20, note: "Riz parfumé, Blanc de poulet, queue de crevette, ananas, légumes diverses" },
      { name: "Riz crevettes ananas", price: 15 },
      { name: "Riz saucisses ananas", price: 15 },
    ],
  },
  {
    key: "A_PARTAGER",
    label: "À partager",
    defaultCategoryName: "À PARTAGER",
    description: "Vos 4 choix sur une planche mixte à partager (PORC - POULET - BOEUF - POISSON - SAUCISSE - CROUPION DE DINDE)",
    items: [
      { name: "Planche Mixte XL (1,5 Kg)", price: 70, note: "Servie avec du riz, Chikwang, banane plantain et une petite salade" },
      { name: "Planche Mixte XXL (2,5 Kg)", price: 100, note: "Servie avec du riz, Chikwang, banane plantain et une petite salade" },
    ],
  },
];

export const REQUIRED_REPAS_CATEGORIES = Array.from(
  new Set(MENU_TEMPLATE_SECTIONS.map((section) => section.defaultCategoryName)),
);


