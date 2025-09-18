/**
 * Filtre une liste générique d'items selon un type et un texte de recherche, puis retourne un slice.
 * Fonction robuste avec logs pour le debug.
 *
 * @template T - Type générique des items
 * @template F - Clés valides pour le filtre (ex: "sales", "purchases", etc.)
 *
 * @example
 * const filtered = filterItems({
 *   items: transactions,
 *   selectedFilter: "sales",
 *   filterMapping: { sales: "sale", purchases: "purchase", payments: "payment" }
 * });
 *
 * console.log(filtered);
 */
export function filterItems<T, F extends string = string>({
    items,
    selectedFilter = "all" as F | "all",
    searchQuery = "",
    typeField = "type" as keyof T,
    searchFields = ["title", "subtitle"] as (keyof T)[],
    filterMapping = {} as Record<F, any>, // facultatif, peut rester vide
    start,
    end,
}: {
    items: T[];
    selectedFilter?: F | "all";
    searchQuery?: string;
    typeField?: keyof T;
    searchFields?: (keyof T)[];
    filterMapping?: Record<F, any>;
    start?: number;
    end?: number;
}): T[] {
    const query = searchQuery.trim().toLowerCase();

    const filtered = items.filter((item) => {
        const typeValue = String(item[typeField]); // valeur réelle dans l'objet
        const mappedFilter = filterMapping[selectedFilter as F] ?? selectedFilter;

        // Comparaison robuste : gestion de "all", pluriel/singulier et majuscules/minuscules
        const matchesFilter =
            selectedFilter === "all" ||
            (mappedFilter != null && String(mappedFilter).toLowerCase() === typeValue.toLowerCase());

        // Filtrage textuel sur les champs définis
        const matchesSearch =
            query === "" ||
            searchFields.some((field) => {
                const value = item[field];
                return typeof value === "string" && value.toLowerCase().includes(query);
            });
        return matchesFilter && matchesSearch;
    });

    // Retourne un slice si start/end définis, sinon toute la liste
    return filtered.slice(start, end);
}
