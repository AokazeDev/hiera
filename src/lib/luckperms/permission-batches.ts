import type { LuckPermsBackup } from "../permissions";

export type PermissionBatchDecision = "grant" | "deny" | "remove";

export type PermissionBatchTargetPreview = {
  groupName: string;
  additions: string[];
  updates: string[];
  removals: string[];
  unchanged: string[];
};

export type PermissionBatchPreview = {
  decision: PermissionBatchDecision;
  permissionKeys: string[];
  targets: PermissionBatchTargetPreview[];
  changeCount: number;
};

function uniqueKeys(permissionKeys: string[]): string[] {
  return [...new Set(permissionKeys.filter((key) => key.trim().length > 0))];
}

export function previewPermissionBatch(
  backup: LuckPermsBackup,
  groupNames: string[],
  permissionKeys: string[],
  decision: PermissionBatchDecision = "grant",
): PermissionBatchPreview {
  const keys = uniqueKeys(permissionKeys);
  const targets = [...new Set(groupNames)]
    .filter((groupName) => backup.groups[groupName])
    .map((groupName) => {
      const globalPermissions = new Map(
        backup.groups[groupName].nodes
          .filter(
            (node) =>
              node.type === "permission" &&
              (!node.context || Object.keys(node.context).length === 0),
          )
          .map((node) => [node.key, node.value]),
      );
      const additions = keys.filter(
        (key) => decision !== "remove" && !globalPermissions.has(key),
      );
      const updates = keys.filter((key) => {
        const existingValue = globalPermissions.get(key);
        return (
          decision === "deny" && existingValue !== undefined && existingValue
        );
      });
      const removals = keys.filter(
        (key) => decision === "remove" && globalPermissions.has(key),
      );

      return {
        groupName,
        additions,
        updates,
        removals,
        unchanged: keys.filter(
          (key) =>
            !additions.includes(key) &&
            !updates.includes(key) &&
            !removals.includes(key),
        ),
      };
    });

  return {
    decision,
    permissionKeys: keys,
    targets,
    changeCount: targets.reduce(
      (count, target) =>
        count +
        target.additions.length +
        target.updates.length +
        target.removals.length,
      0,
    ),
  };
}

export function applyPermissionBatch(
  backup: LuckPermsBackup,
  groupNames: string[],
  permissionKeys: string[],
  decision: PermissionBatchDecision = "grant",
): LuckPermsBackup {
  const preview = previewPermissionBatch(
    backup,
    groupNames,
    permissionKeys,
    decision,
  );
  if (preview.changeCount === 0) return backup;

  return {
    ...backup,
    groups: {
      ...backup.groups,
      ...Object.fromEntries(
        preview.targets
          .filter(
            (target) =>
              target.additions.length > 0 ||
              target.updates.length > 0 ||
              target.removals.length > 0,
          )
          .map((target) => [
            target.groupName,
            {
              ...backup.groups[target.groupName],
              nodes: [
                ...backup.groups[target.groupName].nodes.reduce<
                  LuckPermsBackup["groups"][string]["nodes"]
                >((nodes, node) => {
                  const isGlobalMatch =
                    node.type === "permission" &&
                    (!node.context || Object.keys(node.context).length === 0) &&
                    preview.permissionKeys.includes(node.key);
                  if (isGlobalMatch && decision === "remove") return nodes;
                  if (isGlobalMatch && target.updates.includes(node.key)) {
                    nodes.push({ ...node, value: false });
                  } else {
                    nodes.push(node);
                  }
                  return nodes;
                }, []),
                ...target.additions.map((key) => ({
                  type: "permission",
                  key,
                  value: decision === "grant",
                })),
              ],
            },
          ]),
      ),
    },
  };
}
