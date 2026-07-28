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

export function isValidPermissionKey(key: string): boolean {
  return key.trim().length > 0 && !/\s/.test(key);
}

export function upsertGlobalPermission(
  backup: LuckPermsBackup,
  groupName: string,
  key: string,
  value: boolean,
): LuckPermsBackup {
  const group = backup.groups[groupName];
  if (!group || !isValidPermissionKey(key)) return backup;

  const normalizedKey = key.trim();
  const nodeIndex = group.nodes.findIndex(
    (node) =>
      node.type === "permission" &&
      node.key === normalizedKey &&
      (!node.context || Object.keys(node.context).length === 0),
  );
  const nodes = [...group.nodes];

  if (nodeIndex === -1) {
    nodes.push({ type: "permission", key: normalizedKey, value });
  } else {
    nodes[nodeIndex] = { ...nodes[nodeIndex], value };
  }

  return {
    ...backup,
    groups: { ...backup.groups, [groupName]: { ...group, nodes } },
  };
}

export function setDirectPermissionValue(
  backup: LuckPermsBackup,
  groupName: string,
  nodeIndex: number,
  value: boolean,
): LuckPermsBackup {
  const group = backup.groups[groupName];
  const node = group?.nodes[nodeIndex];
  if (!group || !node || node.type !== "permission") return backup;

  const nodes = [...group.nodes];
  nodes[nodeIndex] = { ...node, value };
  return {
    ...backup,
    groups: { ...backup.groups, [groupName]: { ...group, nodes } },
  };
}

export function removeDirectPermission(
  backup: LuckPermsBackup,
  groupName: string,
  nodeIndex: number,
): LuckPermsBackup {
  const group = backup.groups[groupName];
  const node = group?.nodes[nodeIndex];
  if (!group || !node || node.type !== "permission") return backup;

  return {
    ...backup,
    groups: {
      ...backup.groups,
      [groupName]: {
        ...group,
        nodes: group.nodes.filter((_, index) => index !== nodeIndex),
      },
    },
  };
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
