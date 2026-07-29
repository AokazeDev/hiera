import type { LuckPermsBackup, LuckPermsNode } from "../permissions";
import { getParents } from "./inheritance";
import type { PermissionContext } from "./permission-contexts";
import { getUserMemberships } from "./user-memberships";

export type ResolvedPermission = LuckPermsNode & {
  origin: string;
  originNodeIndex: number;
  inherited: boolean;
  contextConflict?: boolean;
};

function normalizeContextValue(value: string): string {
  return value.trim().toLocaleLowerCase();
}

/** A node applies when every required key matches at least one active value. */
export function matchesActiveContext(
  context: PermissionContext | undefined,
  activeContext: PermissionContext,
): boolean {
  return Object.entries(context ?? {}).every(([key, value]) => {
    const activeValues = Object.entries(activeContext).find(
      ([activeKey]) =>
        normalizeContextValue(activeKey) === normalizeContextValue(key),
    )?.[1];
    if (!activeValues) return false;

    const normalizedActive = new Set(
      (Array.isArray(activeValues) ? activeValues : [activeValues]).map(
        normalizeContextValue,
      ),
    );
    return (Array.isArray(value) ? value : [value]).some((requiredValue) =>
      normalizedActive.has(normalizeContextValue(requiredValue)),
    );
  });
}

function contextSpecificity(node: LuckPermsNode): number {
  return Object.values(node.context ?? {}).reduce(
    (count, value) => count + (Array.isArray(value) ? value.length : 1),
    0,
  );
}

function selectApplicablePermissions(
  nodes: ResolvedPermission[],
): ResolvedPermission[] {
  const selected = new Map<string, ResolvedPermission>();

  for (const node of nodes) {
    const current = selected.get(node.key);
    if (!current) {
      selected.set(node.key, node);
      continue;
    }

    const specificity = contextSpecificity(node);
    const currentSpecificity = contextSpecificity(current);
    if (specificity > currentSpecificity) {
      selected.set(node.key, node);
    } else if (
      specificity === currentSpecificity &&
      node.value !== current.value
    ) {
      selected.set(node.key, { ...current, contextConflict: true });
    }
  }

  return [...selected.values()];
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

/**
 * Resolves a known active context. Direct nodes take precedence over inherited
 * nodes; the most specific applicable node wins within one source. Equal
 * opposites remain visible as a deterministic backup-order result and conflict.
 */
export function getEffectiveNodesForContext(
  backup: LuckPermsBackup,
  groupName: string,
  activeContext: PermissionContext,
  visited = new Set<string>(),
): ResolvedPermission[] {
  const group = backup.groups[groupName];
  if (visited.has(groupName) || !group) return [];

  visited.add(groupName);
  const direct = selectApplicablePermissions(
    group.nodes.flatMap((node, nodeIndex) =>
      node.type === "permission" &&
      matchesActiveContext(node.context, activeContext)
        ? [
            {
              ...node,
              origin: groupName,
              originNodeIndex: nodeIndex,
              inherited: false,
            },
          ]
        : [],
    ),
  );
  const inherited = getParents(group).flatMap((parent) =>
    getEffectiveNodesForContext(backup, parent, activeContext, visited).map(
      (node) => ({ ...node, inherited: true }),
    ),
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

export function getEffectiveUserNodesForContext(
  backup: LuckPermsBackup,
  userId: string,
  activeContext: PermissionContext,
): ResolvedPermission[] {
  const user = backup.users?.[userId];
  if (!user) return [];

  const origin = user.username ?? userId;
  const direct = selectApplicablePermissions(
    user.nodes.flatMap((node, nodeIndex) =>
      node.type === "permission" &&
      matchesActiveContext(node.context, activeContext)
        ? [{ ...node, origin, originNodeIndex: nodeIndex, inherited: false }]
        : [],
    ),
  );
  const inherited = getUserMemberships(user).flatMap((groupName) =>
    getEffectiveNodesForContext(backup, groupName, activeContext).map(
      (node) => ({
        ...node,
        inherited: true,
      }),
    ),
  );

  return [
    ...direct,
    ...inherited.filter((node) => !direct.some((own) => own.key === node.key)),
  ];
}
