import type { LuckPermsBackup, LuckPermsNode } from "../permissions";

export type PermissionContext = NonNullable<LuckPermsNode["context"]>;

function isValidContextValue(value: string | string[]): boolean {
  return Array.isArray(value)
    ? value.length > 0 && value.every((item) => item.trim().length > 0)
    : value.trim().length > 0;
}

export function validatePermissionContext(
  context: PermissionContext,
): string | null {
  for (const [key, value] of Object.entries(context)) {
    if (!key.trim() || /\s|=/.test(key)) {
      return "Cada clave de contexto debe estar escrita sin espacios ni =.";
    }
    if (!isValidContextValue(value)) {
      return "Cada valor de contexto debe contener texto.";
    }
  }
  return null;
}

function contextFingerprint(context: PermissionContext | undefined): string {
  return JSON.stringify(
    Object.entries(context ?? {}).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );
}

function hasMatchingPermissionContext(
  nodes: LuckPermsNode[],
  nodeIndex: number,
  node: LuckPermsNode,
  context: PermissionContext,
): boolean {
  const fingerprint = contextFingerprint(context);
  return nodes.some(
    (candidate, index) =>
      index !== nodeIndex &&
      candidate.type === "permission" &&
      candidate.key === node.key &&
      contextFingerprint(candidate.context) === fingerprint,
  );
}

export function validatePermissionContextUpdate(
  nodes: LuckPermsNode[],
  nodeIndex: number,
  context: PermissionContext,
): string | null {
  const node = nodes[nodeIndex];
  if (!node || node.type !== "permission") {
    return "Selecciona un permiso directo válido.";
  }

  const validationError = validatePermissionContext(context);
  if (validationError) return validationError;
  return hasMatchingPermissionContext(nodes, nodeIndex, node, context)
    ? "Ya existe este permiso con el mismo contexto."
    : null;
}

function replacePermissionContext(
  node: LuckPermsNode,
  context: PermissionContext,
): LuckPermsNode {
  const { context: _existingContext, ...rest } = node;
  return Object.keys(context).length > 0 ? { ...rest, context } : rest;
}

function setPermissionContext(
  backup: LuckPermsBackup,
  nodes: LuckPermsNode[],
  nodeIndex: number,
  context: PermissionContext,
  updateNodes: (nextNodes: LuckPermsNode[]) => LuckPermsBackup,
): LuckPermsBackup {
  const node = nodes[nodeIndex];
  if (validatePermissionContextUpdate(nodes, nodeIndex, context)) {
    return backup;
  }

  const nextNodes = [...nodes];
  nextNodes[nodeIndex] = replacePermissionContext(node, context);
  return updateNodes(nextNodes);
}

export function setDirectPermissionContext(
  backup: LuckPermsBackup,
  groupName: string,
  nodeIndex: number,
  context: PermissionContext,
): LuckPermsBackup {
  const group = backup.groups[groupName];
  if (!group) return backup;

  return setPermissionContext(
    backup,
    group.nodes,
    nodeIndex,
    context,
    (nodes) => ({
      ...backup,
      groups: { ...backup.groups, [groupName]: { ...group, nodes } },
    }),
  );
}

export function setUserDirectPermissionContext(
  backup: LuckPermsBackup,
  userId: string,
  nodeIndex: number,
  context: PermissionContext,
): LuckPermsBackup {
  const user = backup.users?.[userId];
  if (!user || !backup.users) return backup;

  return setPermissionContext(
    backup,
    user.nodes,
    nodeIndex,
    context,
    (nodes) => ({
      ...backup,
      users: { ...backup.users, [userId]: { ...user, nodes } },
    }),
  );
}
