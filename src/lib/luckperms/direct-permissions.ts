import type { LuckPermsBackup } from "../permissions";

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

export function upsertUserGlobalPermission(
  backup: LuckPermsBackup,
  userId: string,
  key: string,
  value: boolean,
): LuckPermsBackup {
  const user = backup.users?.[userId];
  if (!user || !backup.users || !isValidPermissionKey(key)) return backup;

  const normalizedKey = key.trim();
  const nodeIndex = user.nodes.findIndex(
    (node) =>
      node.type === "permission" &&
      node.key === normalizedKey &&
      (!node.context || Object.keys(node.context).length === 0),
  );
  const nodes = [...user.nodes];

  if (nodeIndex === -1) {
    nodes.push({ type: "permission", key: normalizedKey, value });
  } else {
    nodes[nodeIndex] = { ...nodes[nodeIndex], value };
  }

  return {
    ...backup,
    users: { ...backup.users, [userId]: { ...user, nodes } },
  };
}

export function setUserDirectPermissionValue(
  backup: LuckPermsBackup,
  userId: string,
  nodeIndex: number,
  value: boolean,
): LuckPermsBackup {
  const user = backup.users?.[userId];
  const node = user?.nodes[nodeIndex];
  if (!user || !node || node.type !== "permission" || !backup.users) {
    return backup;
  }

  const nodes = [...user.nodes];
  nodes[nodeIndex] = { ...node, value };
  return {
    ...backup,
    users: { ...backup.users, [userId]: { ...user, nodes } },
  };
}

export function removeUserDirectPermission(
  backup: LuckPermsBackup,
  userId: string,
  nodeIndex: number,
): LuckPermsBackup {
  const user = backup.users?.[userId];
  const node = user?.nodes[nodeIndex];
  if (!user || !node || node.type !== "permission" || !backup.users) {
    return backup;
  }

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
