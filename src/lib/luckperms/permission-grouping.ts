export type PermissionGrouping = "flat" | "plugin" | "segment";

export type PermissionGroup<T> = {
  id: string;
  label: string;
  items: T[];
};

function groupIdentity(
  key: string,
  grouping: PermissionGrouping,
): {
  id: string;
  label: string;
} {
  if (grouping === "flat") return { id: "all", label: "Todos" };

  const segments = key.split(".").filter(Boolean);
  if (segments.length === 0) {
    return { id: "unscoped", label: "Sin prefijo" };
  }

  if (grouping === "plugin") {
    return { id: segments[0], label: segments[0] };
  }

  const branch = segments.slice(0, Math.max(1, segments.length - 1)).join(".");
  return { id: branch, label: branch };
}

export function groupPermissions<T>(
  items: T[],
  getKey: (item: T) => string,
  grouping: PermissionGrouping,
): PermissionGroup<T>[] {
  const groups = new Map<string, PermissionGroup<T>>();

  for (const item of items) {
    const { id, label } = groupIdentity(getKey(item), grouping);
    const group = groups.get(id);
    if (group) {
      group.items.push(item);
    } else {
      groups.set(id, { id, label, items: [item] });
    }
  }

  return Array.from(groups.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}
