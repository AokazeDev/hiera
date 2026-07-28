import type { LuckPermsBackup, LuckPermsNode } from "../permissions";

export type NodeChange = {
  kind: "added" | "removed";
  node: LuckPermsNode;
};

export type FieldChange = {
  field: string;
  before: unknown;
  after: unknown;
};

export type BackupEntityDiff = {
  id: string;
  kind: "added" | "removed" | "changed";
  nodeChanges: NodeChange[];
  fieldChanges: FieldChange[];
};

export type BackupDiff = {
  groups: BackupEntityDiff[];
  users: BackupEntityDiff[];
  rootChanges: FieldChange[];
  changeCount: number;
};

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function getNodeChanges(
  before: LuckPermsNode[],
  after: LuckPermsNode[],
): NodeChange[] {
  const unmatchedBefore = new Map<string, LuckPermsNode[]>();
  for (const node of before) {
    const fingerprint = stableStringify(node);
    unmatchedBefore.set(fingerprint, [
      ...(unmatchedBefore.get(fingerprint) ?? []),
      node,
    ]);
  }

  const added: NodeChange[] = [];
  for (const node of after) {
    const fingerprint = stableStringify(node);
    const matches = unmatchedBefore.get(fingerprint);
    if (matches?.length) {
      matches.pop();
    } else {
      added.push({ kind: "added", node });
    }
  }

  return [
    ...[...unmatchedBefore.values()].flat().map((node) => ({
      kind: "removed" as const,
      node,
    })),
    ...added,
  ];
}

function getFieldChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  ignoredFields: string[] = [],
): FieldChange[] {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((field) => !ignoredFields.includes(field))
    .sort()
    .flatMap((field) =>
      stableStringify(before[field]) === stableStringify(after[field])
        ? []
        : [{ field, before: before[field], after: after[field] }],
    );
}

function compareEntities(
  before: Record<string, { nodes: LuckPermsNode[] }> | undefined,
  after: Record<string, { nodes: LuckPermsNode[] }> | undefined,
): BackupEntityDiff[] {
  return [
    ...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]),
  ]
    .sort()
    .flatMap<BackupEntityDiff>((id): BackupEntityDiff | BackupEntityDiff[] => {
      const previous = before?.[id];
      const current = after?.[id];
      if (!previous && current) {
        return [
          {
            id,
            kind: "added" as const,
            nodeChanges: current.nodes.map((node) => ({
              kind: "added" as const,
              node,
            })),
            fieldChanges: getFieldChanges(
              {},
              current as Record<string, unknown>,
              ["nodes"],
            ),
          },
        ];
      }
      if (previous && !current) {
        return [
          {
            id,
            kind: "removed" as const,
            nodeChanges: previous.nodes.map((node) => ({
              kind: "removed" as const,
              node,
            })),
            fieldChanges: getFieldChanges(
              previous as Record<string, unknown>,
              {},
              ["nodes"],
            ),
          },
        ];
      }
      if (!previous || !current) return [];

      const nodeChanges = getNodeChanges(previous.nodes, current.nodes);
      const fieldChanges = getFieldChanges(
        previous as Record<string, unknown>,
        current as Record<string, unknown>,
        ["nodes"],
      );
      return nodeChanges.length || fieldChanges.length
        ? [{ id, kind: "changed" as const, nodeChanges, fieldChanges }]
        : [];
    });
}

export function diffBackups(
  original: LuckPermsBackup,
  edited: LuckPermsBackup,
): BackupDiff {
  const groups = compareEntities(original.groups, edited.groups);
  const users = compareEntities(original.users, edited.users);
  const rootChanges = getFieldChanges(
    original as Record<string, unknown>,
    edited as Record<string, unknown>,
    ["groups", "users"],
  );
  const changeCount =
    groups.reduce(
      (count, group) =>
        count + 1 + group.nodeChanges.length + group.fieldChanges.length,
      0,
    ) +
    users.reduce(
      (count, user) =>
        count + 1 + user.nodeChanges.length + user.fieldChanges.length,
      0,
    ) +
    rootChanges.length;

  return { groups, users, rootChanges, changeCount };
}
