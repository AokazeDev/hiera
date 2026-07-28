import type { LuckPermsNode, PermissionEntry } from "../permissions";
import type { ResolvedPermission } from "./effective-resolution";

export type PermissionStatusFilter = "all" | "granted" | "denied";
export type PermissionContextFilter = "all" | "global" | "contextual";
export type PermissionOriginFilter = "all" | "direct" | "inherited";
export type PermissionRisk = "safe" | "caution" | "dangerous";
export type PermissionRiskFilter = "all" | PermissionRisk;

export type PermissionFilterState = {
  status: PermissionStatusFilter;
  context: PermissionContextFilter;
  origin: PermissionOriginFilter;
  risk: PermissionRiskFilter;
  plugin: string;
};

export const defaultPermissionFilter: PermissionFilterState = {
  status: "all",
  context: "all",
  origin: "all",
  risk: "all",
  plugin: "all",
};

function hasContext(node: LuckPermsNode): boolean {
  return Boolean(node.context && Object.keys(node.context).length > 0);
}

export function extractPluginPrefix(key: string): string | null {
  const segment = key.split(".")[0];
  return segment && segment.length > 0 && segment !== "*" ? segment : null;
}

export function collectPluginPrefixes(nodes: LuckPermsNode[]): string[] {
  const prefixes = new Set<string>();
  for (const node of nodes) {
    if (node.type === "permission") {
      const prefix = extractPluginPrefix(node.key);
      if (prefix) prefixes.add(prefix);
    }
  }
  return Array.from(prefixes).sort((a, b) => a.localeCompare(b));
}

export function assessPermissionRisk(
  key: string,
  catalogEntry?: PermissionEntry,
): PermissionRisk {
  if (catalogEntry) {
    if (catalogEntry.audience.includes("sensitive")) return "dangerous";
    if (catalogEntry.audience.includes("admin")) return "caution";
    if (catalogEntry.audience.includes("player")) return "safe";
  }

  if (
    key.endsWith(".*") ||
    key === "*" ||
    key.includes("bypass") ||
    key.includes("admin.*")
  ) {
    return "dangerous";
  }

  if (
    key.includes("admin") ||
    key.includes("reload") ||
    key.includes("purge") ||
    key.includes("debug")
  ) {
    return "caution";
  }

  return "safe";
}

function matchesStatusFilter(
  node: LuckPermsNode,
  filter: PermissionStatusFilter,
): boolean {
  if (filter === "all") return true;
  return filter === "granted" ? node.value : !node.value;
}

function matchesContextFilter(
  node: LuckPermsNode,
  filter: PermissionContextFilter,
): boolean {
  if (filter === "all") return true;
  const contextual = hasContext(node);
  return filter === "contextual" ? contextual : !contextual;
}

function matchesOriginFilter(
  node: ResolvedPermission,
  filter: PermissionOriginFilter,
): boolean {
  if (filter === "all") return true;
  return filter === "direct" ? !node.inherited : node.inherited;
}

function matchesRiskFilter(
  node: LuckPermsNode,
  filter: PermissionRiskFilter,
  catalogEntry?: PermissionEntry,
): boolean {
  if (filter === "all") return true;
  return assessPermissionRisk(node.key, catalogEntry) === filter;
}

function matchesPluginFilter(node: LuckPermsNode, filter: string): boolean {
  if (filter === "all") return true;
  const prefix = extractPluginPrefix(node.key);
  return prefix === filter;
}

export function filterPermissionNodes(
  nodes: LuckPermsNode[],
  filters: PermissionFilterState,
  catalog?: Map<string, PermissionEntry>,
): Array<{ node: LuckPermsNode; index: number }> {
  return nodes.flatMap((node, index) => {
    if (node.type !== "permission") return [];
    if (!matchesStatusFilter(node, filters.status)) return [];
    if (!matchesContextFilter(node, filters.context)) return [];
    if (!matchesRiskFilter(node, filters.risk, catalog?.get(node.key)))
      return [];
    if (!matchesPluginFilter(node, filters.plugin)) return [];
    return [{ node, index }];
  });
}

export function filterResolvedPermissions(
  nodes: ResolvedPermission[],
  filters: PermissionFilterState,
  catalog?: Map<string, PermissionEntry>,
): ResolvedPermission[] {
  return nodes.filter((node) => {
    if (!matchesStatusFilter(node, filters.status)) return false;
    if (!matchesContextFilter(node, filters.context)) return false;
    if (!matchesOriginFilter(node, filters.origin)) return false;
    if (!matchesRiskFilter(node, filters.risk, catalog?.get(node.key)))
      return false;
    if (!matchesPluginFilter(node, filters.plugin)) return false;
    return true;
  });
}

export function formatRiskLabel(risk: PermissionRisk): string {
  switch (risk) {
    case "safe":
      return "Seguro";
    case "caution":
      return "Precaución";
    case "dangerous":
      return "Peligroso";
  }
}
