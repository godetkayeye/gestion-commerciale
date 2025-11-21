export const ROLE_VALUES = [
  "ADMIN",
  "CAISSIER",
  "LOCATION",
  "MANAGER_MULTI",
  "CAISSE_RESTAURANT",
  "CAISSE_BAR",
  "CAISSE_LOCATION",
  "CONSEIL_ADMINISTRATION",
  "SUPERVISEUR",
  "ECONOMAT",
] as const;

export type Role = (typeof ROLE_VALUES)[number];

export const MANAGER_ASSIGNABLE_ROLES = [
  "CAISSIER",
  "LOCATION",
  "MANAGER_MULTI",
  "CAISSE_RESTAURANT",
  "CAISSE_BAR",
  "CAISSE_LOCATION",
  "CONSEIL_ADMINISTRATION",
  "SUPERVISEUR",
  "ECONOMAT",
] as const satisfies Readonly<Role[]>;

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrateur",
  CAISSIER: "Caissier",
  LOCATION: "Location",
  MANAGER_MULTI: "Manager Multi",
  CAISSE_RESTAURANT: "Caisse VILAKAZI",
  CAISSE_BAR: "Caisse BLACK & WHITE",
  CAISSE_LOCATION: "Caisse ACAJOU",
  CONSEIL_ADMINISTRATION: "Conseil d'Administration",
  SUPERVISEUR: "Superviseur",
  ECONOMAT: "Économat",
};

