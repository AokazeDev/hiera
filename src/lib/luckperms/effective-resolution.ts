import type { LuckPermsBackup, LuckPermsNode } from "../permissions";
import { getParents } from "./inheritance";
import { getUserMemberships } from "./user-memberships";

export type ResolvedPermission = LuckPermsNode & {
  origin: string;
  originNodeIndex: number;
  inherited: boolean;
};

/** Resolves direct permissions first so child groups explicitly override parents. */
export function getEffectiveNodes(
  backup: LuckPermsBackup,
  groupName: string,
  visited = new Set<string>(),
): ResolvedPermission[] {
  const group = backup.groups[groupName];
  if (visited.has(groupName) || !group) return [];

  visited.add(groupName);
  const direct = group.nodes.flatMap((node, nodeIndex) =>
    node.type === "permission"
      ? [
          {
            ...node,
            origin: groupName,
            originNodeIndex: nodeIndex,
            inherited: false,
          },
        ]
      : [],
  );
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

/** User nodes override the permissions inherited through assigned groups. */
export function getEffectiveUserNodes(
  backup: LuckPermsBackup,
  userId: string,
): ResolvedPermission[] {
  const user = backup.users?.[userId];
  if (!user) return [];

  const origin = user.username ?? userId;
  const direct = user.nodes.flatMap((node, nodeIndex) =>
    node.type === "permission"
      ? [{ ...node, origin, originNodeIndex: nodeIndex, inherited: false }]
      : [],
  );
  const inherited = getUserMemberships(user).flatMap((groupName) =>
    getEffectiveNodes(backup, groupName).map((node) => ({
      ...node,
      inherited: true,
    })),
  );
  const resolved = [...direct];

  for (const node of inherited) {
    if (!resolved.some((current) => current.key === node.key)) {
      resolved.push(node);
    }
  }

  return resolved;
}
