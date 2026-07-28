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

export function getUserMemberships(user: { nodes: LuckPermsNode[] }): string[] {
  return getParents(user);
}

export function validateUserMembership(
  backup: LuckPermsBackup,
  userId: string,
  groupName: string,
): string | null {
  const user = backup.users?.[userId];
  const group = groupName.trim();

  if (!user) return "El usuario seleccionado no existe en el backup.";
  if (!group) return "Selecciona un grupo para añadirlo.";
  if (!backup.groups[group])
    return "El grupo seleccionado no existe en el backup.";
  if (getUserMemberships(user).includes(group)) {
    return "Este usuario ya pertenece a ese grupo.";
  }

  return null;
}

export function addUserMembership(
  backup: LuckPermsBackup,
  userId: string,
  groupName: string,
): LuckPermsBackup {
  const error = validateUserMembership(backup, userId, groupName);
  const user = backup.users?.[userId];
  if (error || !user || !backup.users) return backup;

  return {
    ...backup,
    users: {
      ...backup.users,
      [userId]: {
        ...user,
        nodes: [
          ...user.nodes,
          {
            type: "inheritance",
            key: `group.${groupName.trim()}`,
            value: true,
          },
        ],
      },
    },
  };
}

export function removeUserMembership(
  backup: LuckPermsBackup,
  userId: string,
  nodeIndex: number,
): LuckPermsBackup {
  const user = backup.users?.[userId];
  const node = user?.nodes[nodeIndex];
  if (!user || !node || node.type !== "inheritance" || !backup.users)
    return backup;

  return {
    ...backup,
    users: {
      ...backup.users,
      [userId]: {
        ...user,
        nodes: user.nodes.filter((_, index) => index !== nodeIndex),
      },
    },
  };
}

export function setUserPrimaryGroup(
  backup: LuckPermsBackup,
  userId: string,
  groupName: string | null,
): LuckPermsBackup {
  const user = backup.users?.[userId];
  if (!user || !backup.users) return backup;
  if (groupName && !backup.groups[groupName]) return backup;

  const nextUser = { ...user };
  if (groupName) nextUser.primaryGroup = groupName;
  else delete nextUser.primaryGroup;

  return { ...backup, users: { ...backup.users, [userId]: nextUser } };
}

export function isValidPermissionKey(key: string): boolean {
  return key.trim().length > 0 && !/\s/.test(key);
}

export type GroupReference = {
  source: string;
  kind: "inheritance" | "primary-group";
};

export function validateNewGroupName(
  backup: LuckPermsBackup,
  groupName: string,
): string | null {
  const name = groupName.trim();
  if (!name) return "Escribe el nombre del grupo.";
  if (/\s/.test(name)) return "El nombre del grupo no puede contener espacios.";
  if (backup.groups[name]) return "Ya existe un grupo con ese nombre.";
  return null;
}

export function createGroup(
  backup: LuckPermsBackup,
  groupName: string,
): LuckPermsBackup {
  const name = groupName.trim();
  if (validateNewGroupName(backup, name)) return backup;

  return {
    ...backup,
    groups: { ...backup.groups, [name]: { nodes: [] } },
  };
}

export function getGroupReferences(
  backup: LuckPermsBackup,
  groupName: string,
): GroupReference[] {
  const inheritanceKey = `group.${groupName}`;
  const groupReferences = Object.entries(backup.groups).flatMap(
    ([name, group]) =>
      group.nodes.some(
        (node) =>
          node.type === "inheritance" &&
          node.value &&
          node.key === inheritanceKey,
      )
        ? [{ source: name, kind: "inheritance" as const }]
        : [],
  );
  const primaryGroupReferences = Object.entries(backup.users ?? {}).flatMap(
    ([uuid, user]) =>
      user.primaryGroup === groupName
        ? [{ source: user.username ?? uuid, kind: "primary-group" as const }]
        : [],
  );

  return [...groupReferences, ...primaryGroupReferences];
}

export function validateGroupDeletion(
  backup: LuckPermsBackup,
  groupName: string,
): string | null {
  if (!backup.groups[groupName])
    return "El grupo seleccionado no existe en el backup.";
  const references = getGroupReferences(backup, groupName);
  if (references.length) {
    return "No se puede eliminar mientras existan herencias o grupos primarios que lo usen.";
  }
  return null;
}

export function deleteGroup(
  backup: LuckPermsBackup,
  groupName: string,
): LuckPermsBackup {
  if (validateGroupDeletion(backup, groupName)) return backup;
  const { [groupName]: _, ...groups } = backup.groups;
  return { ...backup, groups };
}

export function renameGroup(
  backup: LuckPermsBackup,
  groupName: string,
  nextGroupName: string,
): LuckPermsBackup {
  const nextName = nextGroupName.trim();
  if (!backup.groups[groupName] || groupName === nextName) return backup;
  if (validateNewGroupName(backup, nextName)) return backup;

  const inheritanceKey = `group.${groupName}`;
  const groups = Object.fromEntries(
    Object.entries(backup.groups).map(([name, group]) => [
      name === groupName ? nextName : name,
      {
        ...group,
        nodes: group.nodes.map((node) =>
          node.type === "inheritance" && node.key === inheritanceKey
            ? { ...node, key: `group.${nextName}` }
            : node,
        ),
      },
    ]),
  );
  const users = backup.users
    ? Object.fromEntries(
        Object.entries(backup.users).map(([uuid, user]) => [
          uuid,
          {
            ...user,
            ...(user.primaryGroup === groupName && { primaryGroup: nextName }),
            nodes: user.nodes.map((node) =>
              node.type === "inheritance" && node.key === inheritanceKey
                ? { ...node, key: `group.${nextName}` }
                : node,
            ),
          },
        ]),
      )
    : undefined;

  return { ...backup, groups, ...(users && { users }) };
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
