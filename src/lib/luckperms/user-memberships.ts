import type { LuckPermsBackup, LuckPermsNode } from "../permissions";
import { getParents } from "./inheritance";

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
  if (!backup.groups[group]) {
    return "El grupo seleccionado no existe en el backup.";
  }
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
  if (!user || !node || node.type !== "inheritance" || !backup.users) {
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
