import type { LuckPermsBackup } from "../permissions";

export type PermissionBatchTargetPreview = {
  groupName: string;
  additions: string[];
  alreadyPresent: string[];
};

export type PermissionBatchPreview = {
  permissionKeys: string[];
  targets: PermissionBatchTargetPreview[];
  additionCount: number;
};

function uniqueKeys(permissionKeys: string[]): string[] {
  return [...new Set(permissionKeys.filter((key) => key.trim().length > 0))];
}

export function previewPermissionBatch(
  backup: LuckPermsBackup,
  groupNames: string[],
  permissionKeys: string[],
): PermissionBatchPreview {
  const keys = uniqueKeys(permissionKeys);
  const targets = [...new Set(groupNames)]
    .filter((groupName) => backup.groups[groupName])
    .map((groupName) => {
      const globalPermissions = new Set(
        backup.groups[groupName].nodes
          .filter(
            (node) => node.type === "permission" && node.context === undefined,
          )
          .map((node) => node.key),
      );
      const additions = keys.filter((key) => !globalPermissions.has(key));

      return {
        groupName,
        additions,
        alreadyPresent: keys.filter((key) => globalPermissions.has(key)),
      };
    });

  return {
    permissionKeys: keys,
    targets,
    additionCount: targets.reduce(
      (count, target) => count + target.additions.length,
      0,
    ),
  };
}

export function applyPermissionBatch(
  backup: LuckPermsBackup,
  groupNames: string[],
  permissionKeys: string[],
): LuckPermsBackup {
  const preview = previewPermissionBatch(backup, groupNames, permissionKeys);
  if (preview.additionCount === 0) return backup;

  return {
    ...backup,
    groups: {
      ...backup.groups,
      ...Object.fromEntries(
        preview.targets
          .filter((target) => target.additions.length > 0)
          .map((target) => [
            target.groupName,
            {
              ...backup.groups[target.groupName],
              nodes: [
                ...backup.groups[target.groupName].nodes,
                ...target.additions.map((key) => ({
                  type: "permission",
                  key,
                  value: true,
                })),
              ],
            },
          ]),
      ),
    },
  };
}
