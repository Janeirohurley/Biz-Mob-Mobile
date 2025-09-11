/**
 * Filtre une liste générique d'items selon un type et un texte de recherche, puis retourne un slice.
 *
 * @template T - Le type de l'item
 * @template F - Les clés valides du filtre
 */
export function filterItems<T, F extends string = string>({
    items,
    selectedFilter = "all" as F | "all",
    searchQuery = "",
    typeField = "type" as keyof T,
    searchFields = ["title", "subtitle"] as (keyof T)[],
    filterMapping = {
        sales: "sale",
        purchases: "purchase",
        payments: "payment",
        audit: "audit",
    } as Record<F, any>,
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
        // Filtre par type
        const typeValue = item[typeField];
        const matchesFilter =
            selectedFilter === "all" || filterMapping[selectedFilter as F] === typeValue;

        // Filtre par recherche
        const matchesSearch =
            query === "" ||
            searchFields.some((field) => {
                const value = item[field];
                return typeof value === "string" && value.toLowerCase().includes(query);
            });

        return matchesFilter && matchesSearch;
    });

    // Retourne le slice si défini, sinon tout
    return filtered.slice(start, end);
}
