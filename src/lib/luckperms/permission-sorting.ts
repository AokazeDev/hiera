import type { LuckPermsNode, PermissionEntry } from "../permissions";

export type PermissionSort =
  | "name"
  | "status"
  | "category"
  | "origin"
  | "recommendation";

type SortablePermission = LuckPermsNode & {
  origin?: string;
  inherited?: boolean;
};

function compareText(left: string, right: string): number {
  return left.localeCompare(right, "es", { sensitivity: "base" });
}

function categoryRank(entry?: PermissionEntry): string {
  return entry?.category ?? "\uffff";
}

function recommendationRank(entry?: PermissionEntry): number {
  if (!entry) return 4;
  if (entry.audience.includes("sensitive")) return 3;
  if (entry.audience.includes("admin")) return 2;
  if (entry.audience.includes("group")) return 1;
  return 0;
}

function compareBySort(
  left: SortablePermission,
  right: SortablePermission,
  sort: PermissionSort,
  catalog?: Map<string, PermissionEntry>,
): number {
  if (sort === "status") return Number(!left.value) - Number(!right.value);
  if (sort === "origin")
    return Number(Boolean(left.inherited)) - Number(Boolean(right.inherited));
  if (sort === "category") {
    return compareText(
      categoryRank(catalog?.get(left.key)),
      categoryRank(catalog?.get(right.key)),
    );
  }
  if (sort === "recommendation") {
    return (
      recommendationRank(catalog?.get(left.key)) -
      recommendationRank(catalog?.get(right.key))
    );
  }
  return 0;
}

/** Returns a new deterministic order without changing the imported backup nodes. */
export function sortPermissions<T>(
  permissions: T[],
  sort: PermissionSort,
  getPermission: (permission: T) => SortablePermission,
  catalog?: Map<string, PermissionEntry>,
): T[] {
  return [...permissions].sort((left, right) => {
    const leftPermission = getPermission(left);
    const rightPermission = getPermission(right);
    const order = compareBySort(leftPermission, rightPermission, sort, catalog);
    return order || compareText(leftPermission.key, rightPermission.key);
  });
}
