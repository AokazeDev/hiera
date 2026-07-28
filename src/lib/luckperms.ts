import type { LuckPermsBackup, LuckPermsNode } from "./permissions";

export type ResolvedPermission = LuckPermsNode & {
  origin: string;
  inherited: boolean;
};

export function getParents(group: { nodes: LuckPermsNode[] }): string[] {
  return group.nodes
    .filter((node) => node.type === "inheritance" && node.value)
    .map((node) => node.key.replace(/^group\./, ""));
}

/** Resolves direct permissions first so child groups explicitly override parents. */
export function getEffectiveNodes(
  backup: LuckPermsBackup,
  groupName: string,
  visited = new Set<string>(),
): ResolvedPermission[] {
  const group = backup.groups[groupName];
  if (visited.has(groupName) || !group) return [];

  visited.add(groupName);
  const direct = group.nodes
    .filter((node) => node.type === "permission")
    .map((node) => ({ ...node, origin: groupName, inherited: false }));
  const inherited = getParents(group).flatMap((parent) =>
    getEffectiveNodes(backup, parent, visited).map((node) => ({
      ...node,
      inherited: true,
    })),
  );

  return [
    ...direct,
    ...inherited.filter((node) => !direct.some((own) => own.key === node.key)),
  ];
}
