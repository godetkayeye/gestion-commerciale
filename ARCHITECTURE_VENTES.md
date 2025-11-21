# Architecture des Ventes Restaurant/Bar

## 📊 Vue d'ensemble

Le système permet au **caissier restaurant** (`CAISSE_RESTAURANT`) de vendre à la fois des **plats** et des **boissons** dans une **seule commande**, avec une **facture unique**.

---

## 🗄️ Stockage des Données

### 1. **Ventes de PLATS (Restaurant)**

Les plats sont stockés dans :

- **Table principale** : `commande` 
  - Contient : ID, table, total, statut, date, caissier_id, serveur_id, etc.
  
- **Table de détails** : `details_commande`
  - Contient : commande_id, repas_id, quantite, prix_unitaire, prix_total
  - Relation : Un plat = une ligne dans `details_commande`

**Exemple** :
```
commande (id=13, total=15000, table_numero="1")
  └── details_commande (repas_id=5, quantite=2, prix_total=10000)
  └── details_commande (repas_id=4, quantite=1, prix_total=5000)
```

### 2. **Ventes de BOISSONS (Bar)**

Les boissons sont stockées dans :

- **Table principale** : `commande` (LA MÊME que pour les plats)
  - Une seule commande peut contenir plats ET boissons
  
- **Table de liaison** : `commande_boissons_restaurant`
  - Contient : commande_id, boisson_id, quantite, prix_unitaire, prix_total
  - Relation : Une boisson = une ligne dans `commande_boissons_restaurant`
  - **C'est cette table qui permet d'ajouter des boissons aux commandes restaurant**

**Exemple** :
```
commande (id=13, total=20000, table_numero="1")
  └── details_commande (repas_id=5, quantite=2, prix_total=10000)  ← PLAT
  └── commande_boissons_restaurant (boisson_id=2, quantite=1, prix_total=5000)  ← BOISSON
  └── commande_boissons_restaurant (boisson_id=4, quantite=1, prix_total=5000)  ← BOISSON
```

---

## 🎯 Rôle de la Table `commande_boissons_restaurant`

Cette table sert de **pont** entre :
- Les **commandes restaurant** (table `commande`)
- Les **boissons** (table `boissons`)

**Pourquoi cette table ?**
- Permet d'ajouter des boissons à une commande restaurant existante
- Maintient la séparation des stocks (boissons vs plats)
- Permet une facture unique combinant plats + boissons
- Un seul caissier peut gérer tout (plats + boissons)

---

## 📋 Flux de Vente Unifié

### Scénario : Caissier vend 2 plats + 2 boissons

1. **Création de la commande** :
   ```
   POST /api/restaurant/commandes
   {
     table_numero: "1",
     items: [{ repas_id: 5, quantite: 2 }],           ← PLATS
     items_boissons: [{ boisson_id: 2, quantite: 1 }]  ← BOISSONS
   }
   ```

2. **Stockage en base** :
   - **1 ligne** dans `commande` (id=13, total=15000)
   - **1 ligne** dans `details_commande` (pour le plat)
   - **1 ligne** dans `commande_boissons_restaurant` (pour la boisson)

3. **Affichage** :
   - Page "Détails & Suivi" : Affiche plats ET boissons séparément
   - Facture PDF : Combine plats + boissons dans un seul document

---

## 🔍 Différence avec l'Ancien Système Bar

### Ancien système (Bar séparé) :
- Table : `commandes_bar` + `commande_details`
- Utilisé uniquement pour les ventes de boissons SEULES (sans plats)
- Géré par le module Bar

### Nouveau système (Restaurant unifié) :
- Table : `commande` + `details_commande` + `commande_boissons_restaurant`
- Permet plats + boissons dans une seule commande
- Géré par le caissier restaurant

---

## ✅ Ce qui est Déjà en Place

✅ **Ventes de plats** → Table `commande` + `details_commande`  
✅ **Ventes de boissons** → Table `commande` + `commande_boissons_restaurant`  
✅ **Un seul caissier** → Le caissier restaurant peut tout gérer  
✅ **Facture unique** → PDF combine plats + boissons  
✅ **Détails & Suivi** → Affiche plats et boissons séparément  

---

## 🎨 Interface "Détails & Suivi"

Quand le caissier consulte une commande :

1. **Section "Plats"** : Liste tous les plats de la commande
2. **Section "Boissons"** : Liste toutes les boissons de la commande
3. **Résumé financier** : Total combiné (plats + boissons)

---

## 📄 Facture Unique

La facture PDF générée contient :
- **En-tête** : Informations de l'établissement
- **Plats** : Liste avec quantité, prix unitaire, total
- **Boissons** : Liste avec quantité, prix unitaire, total
- **Total général** : Somme de tous les plats + toutes les boissons
- **Informations de paiement** : Mode, devise, caissier, date

---

## 🔧 Points Techniques

### Récupération des données :

```typescript
// 1. Récupérer la commande avec les plats
const commande = await prisma.commande.findUnique({
  where: { id },
  include: {
    details: { include: { repas: true } }  // ← PLATS
  }
});

// 2. Récupérer les boissons séparément (car relation non reconnue par Prisma)
const boissons = await prisma.commande_boissons_restaurant.findMany({
  where: { commande_id: id },
  include: { boisson: true }  // ← BOISSONS
});

// 3. Combiner pour l'affichage
const allItems = [
  ...commande.details.map(d => ({ type: "plat", ...d })),
  ...boissons.map(b => ({ type: "boisson", ...b }))
];
```

---

## 🎯 Conclusion

**Tout est déjà en place !** Le système permet :
- ✅ Un seul caissier pour plats + boissons
- ✅ Stockage dans les tables habituelles
- ✅ Facture unique combinée
- ✅ Détails bien décrits dans l'interface

La table `commande_boissons_restaurant` est le **lien** qui permet d'ajouter des boissons aux commandes restaurant, créant ainsi un système unifié.


