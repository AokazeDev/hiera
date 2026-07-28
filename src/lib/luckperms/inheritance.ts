import type { LuckPermsBackup, LuckPermsNode } from "../permissions";

export function getParents(group: { nodes: LuckPermsNode[] }): string[] {
  return group.nodes
    .filter((node) => node.type === "inheritance" && node.value)
    .map((node) => node.key.replace(/^group\./, ""));
}

export function validateGroupInheritance(
  backup: LuckPermsBackup,
  groupName: string,
  parentName: string,
): string | null {
  const parent = parentName.trim();
  const group = backup.groups[groupName];

  if (!group) return "El grupo seleccionado no existe en el backup.";
  if (!parent) return "Escribe el nombre de un grupo padre.";
  if (!backup.groups[parent]) return "El grupo padre no existe en el backup.";
  if (parent === groupName) return "Un grupo no puede heredarse a si mismo.";
  if (getParents(group).includes(parent)) {
    return "Este grupo ya hereda de ese padre.";
  }

  const pending = new Set<string>();
  function reachesGroup(current: string): boolean {
    if (current === groupName) return true;
    if (pending.has(current)) return false;
    pending.add(current);
    return getParents(backup.groups[current] ?? { nodes: [] }).some(
      reachesGroup,
    );
  }

  if (reachesGroup(parent)) {
    return "Esta herencia crearia un ciclo entre grupos.";
  }

  return null;
}

export function addGroupInheritance(
  backup: LuckPermsBackup,
  groupName: string,
  parentName: string,
): LuckPermsBackup {
  const error = validateGroupInheritance(backup, groupName, parentName);
  const group = backup.groups[groupName];
  if (error || !group) return backup;

  return {
    ...backup,
    groups: {
      ...backup.groups,
      [groupName]: {
        ...group,
        nodes: [
          ...group.nodes,
          {
            type: "inheritance",
            key: `group.${parentName.trim()}`,
            value: true,
          },
        ],
      },
    },
  };
}

export function removeGroupInheritance(
  backup: LuckPermsBackup,
  groupName: string,
  nodeIndex: number,
): LuckPermsBackup {
  const group = backup.groups[groupName];
  const node = group?.nodes[nodeIndex];
  if (!group || !node || node.type !== "inheritance") return backup;

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
