import type { LuckPermsBackup, LuckPermsNode } from "../permissions";
import { getParents } from "./inheritance";

type NodeOwner = "group" | "user";

export type DuplicatePermissionIssue = {
  owner: NodeOwner;
  ownerId: string;
  key: string;
  nodeIndexes: number[];
};

export type MissingGroupReferenceIssue = {
  owner: NodeOwner;
  ownerId: string;
  groupName: string;
  kind: "inheritance" | "primary-group";
  nodeIndex?: number;
};

export type InheritanceCycleIssue = { groups: string[] };

export type BackupDiagnostics = {
  duplicatePermissions: DuplicatePermissionIssue[];
  missingGroupReferences: MissingGroupReferenceIssue[];
  inheritanceCycles: InheritanceCycleIssue[];
};

function contextFingerprint(node: LuckPermsNode): string {
  return JSON.stringify(
    Object.entries(node.context ?? {}).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );
}

function findDuplicatePermissions(
  owner: NodeOwner,
  ownerId: string,
  nodes: LuckPermsNode[],
): DuplicatePermissionIssue[] {
  const indexesByPermission = new Map<string, number[]>();

  nodes.forEach((node, index) => {
    if (node.type !== "permission") return;
    const fingerprint = `${node.key}\u0000${contextFingerprint(node)}`;
    indexesByPermission.set(fingerprint, [
      ...(indexesByPermission.get(fingerprint) ?? []),
      index,
    ]);
  });

  return [...indexesByPermission.entries()].flatMap(([fingerprint, indexes]) =>
    indexes.length > 1
      ? [
          {
            owner,
            ownerId,
            key: fingerprint.split("\u0000")[0],
            nodeIndexes: indexes,
          },
        ]
      : [],
  );
}

function normalizeCycle(cycle: string[]): string[] {
  const groups = cycle.slice(0, -1);
  const rotations = groups.map((_, index) => [
    ...groups.slice(index),
    ...groups.slice(0, index),
  ]);
  const normalized = rotations.sort((left, right) =>
    left.join("\u0000").localeCompare(right.join("\u0000")),
  )[0];
  return [...normalized, normalized[0]];
}

function findInheritanceCycles(
  backup: LuckPermsBackup,
): InheritanceCycleIssue[] {
  const cycles = new Map<string, InheritanceCycleIssue>();

  for (const groupName of Object.keys(backup.groups)) {
    const path: string[] = [];
    const visiting = new Set<string>();
    const visited = new Set<string>();

    function visit(current: string) {
      if (visiting.has(current)) {
        const cycle = normalizeCycle([
          ...path.slice(path.indexOf(current)),
          current,
        ]);
        cycles.set(cycle.slice(0, -1).join("\u0000"), { groups: cycle });
        return;
      }
      if (visited.has(current) || !backup.groups[current]) return;

      visiting.add(current);
      path.push(current);
      for (const parent of getParents(backup.groups[current])) visit(parent);
      path.pop();
      visiting.delete(current);
      visited.add(current);
    }

    visit(groupName);
  }

  return [...cycles.values()];
}

/** Inspects imported data without changing it, including legacy-invalid structures. */
export function diagnoseBackup(backup: LuckPermsBackup): BackupDiagnostics {
  const duplicatePermissions: DuplicatePermissionIssue[] = [];
  const missingGroupReferences: MissingGroupReferenceIssue[] = [];

  for (const [groupName, group] of Object.entries(backup.groups)) {
    duplicatePermissions.push(
      ...findDuplicatePermissions("group", groupName, group.nodes),
    );
    group.nodes.forEach((node, nodeIndex) => {
      if (node.type !== "inheritance" || !node.value) return;
      const parent = node.key.replace(/^group\./, "");
      if (!backup.groups[parent]) {
        missingGroupReferences.push({
          owner: "group",
          ownerId: groupName,
          groupName: parent,
          kind: "inheritance",
          nodeIndex,
        });
      }
    });
  }

  for (const [userId, user] of Object.entries(backup.users ?? {})) {
    duplicatePermissions.push(
      ...findDuplicatePermissions("user", userId, user.nodes),
    );
    user.nodes.forEach((node, nodeIndex) => {
      if (node.type !== "inheritance" || !node.value) return;
      const groupName = node.key.replace(/^group\./, "");
      if (!backup.groups[groupName]) {
        missingGroupReferences.push({
          owner: "user",
          ownerId: userId,
          groupName,
          kind: "inheritance",
          nodeIndex,
        });
      }
    });
    if (user.primaryGroup && !backup.groups[user.primaryGroup]) {
      missingGroupReferences.push({
        owner: "user",
        ownerId: userId,
        groupName: user.primaryGroup,
        kind: "primary-group",
      });
    }
  }

  return {
    duplicatePermissions,
    missingGroupReferences,
    inheritanceCycles: findInheritanceCycles(backup),
  };
}
