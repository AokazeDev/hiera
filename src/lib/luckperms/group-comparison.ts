import type { LuckPermsBackup, LuckPermsNode } from "../permissions";
import {
  getEffectiveNodes,
  type ResolvedPermission,
} from "./effective-resolution";

export type PermissionDifference<T extends LuckPermsNode> = {
  key: string;
  context: Array<[string, string]>;
  left?: T;
  right?: T;
};

export type GroupComparison = {
  direct: PermissionDifference<LuckPermsNode>[];
  effective: PermissionDifference<ResolvedPermission>[];
};

function permissionContext(node: LuckPermsNode): Array<[string, string]> {
  return Object.entries(node.context ?? {})
    .flatMap(([key, value]) =>
      (Array.isArray(value) ? value : [value]).map((item): [string, string] => [
        key,
        item,
      ]),
    )
    .sort(([left], [right]) => left.localeCompare(right));
}

function permissionIdentity(node: LuckPermsNode) {
  return `${node.key}\u0000${JSON.stringify(permissionContext(node))}`;
}

function findPermissionDifferences<T extends LuckPermsNode>(
  left: T[],
  right: T[],
  isSame: (left: T, right: T) => boolean = (left, right) =>
    left.value === right.value,
): PermissionDifference<T>[] {
  const leftByIdentity = new Map(
    left.map((node) => [permissionIdentity(node), node]),
  );
  const rightByIdentity = new Map(
    right.map((node) => [permissionIdentity(node), node]),
  );
  const identities = new Set([
    ...leftByIdentity.keys(),
    ...rightByIdentity.keys(),
  ]);
  const differences: PermissionDifference<T>[] = [];

  for (const identity of identities) {
    const leftNode = leftByIdentity.get(identity);
    const rightNode = rightByIdentity.get(identity);
    if (leftNode && rightNode && isSame(leftNode, rightNode)) continue;
    const node = leftNode ?? rightNode;
    if (!node) continue;
    differences.push({
      key: node.key,
      context: permissionContext(node),
      left: leftNode,
      right: rightNode,
    });
  }

  return differences.sort((left, right) => left.key.localeCompare(right.key));
}

/** Compares only permission nodes, keeping a context distinct from its global equivalent. */
export function compareGroups(
  backup: LuckPermsBackup,
  leftGroup: string,
  rightGroup: string,
): GroupComparison {
  const leftDirect =
    backup.groups[leftGroup]?.nodes.filter(
      (node) => node.type === "permission",
    ) ?? [];
  const rightDirect =
    backup.groups[rightGroup]?.nodes.filter(
      (node) => node.type === "permission",
    ) ?? [];

  return {
    direct: findPermissionDifferences(leftDirect, rightDirect),
    effective: findPermissionDifferences(
      getEffectiveNodes(backup, leftGroup),
      getEffectiveNodes(backup, rightGroup),
      (left, right) =>
        left.value === right.value &&
        left.origin === right.origin &&
        left.inherited === right.inherited,
    ),
  };
}
