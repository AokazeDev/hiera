import type { LuckPermsBackup } from "../permissions";
import {
  isValidPermissionKey,
  upsertGlobalPermission,
} from "./direct-permissions";

export type CatalogPermissionDecision = "grant" | "deny";

export type CatalogPermissionDecisionPreview = {
  key: string;
  groupName: string;
  value: boolean;
  existingGlobalValue: boolean | null;
};

export function previewCatalogPermissionDecision(
  backup: LuckPermsBackup,
  key: string,
  groupName: string,
  decision: CatalogPermissionDecision,
): CatalogPermissionDecisionPreview | null {
  const group = backup.groups[groupName];
  if (!group || !isValidPermissionKey(key)) return null;

  const normalizedKey = key.trim();
  const existingGlobalPermission = group.nodes.find(
    (node) =>
      node.type === "permission" &&
      node.key === normalizedKey &&
      (!node.context || Object.keys(node.context).length === 0),
  );

  return {
    key: normalizedKey,
    groupName,
    value: decision === "grant",
    existingGlobalValue:
      existingGlobalPermission?.type === "permission"
        ? existingGlobalPermission.value
        : null,
  };
}

export function applyCatalogPermissionDecision(
  backup: LuckPermsBackup,
  key: string,
  groupName: string,
  decision: CatalogPermissionDecision,
): LuckPermsBackup {
  if (!previewCatalogPermissionDecision(backup, key, groupName, decision)) {
    return backup;
  }

  return upsertGlobalPermission(backup, groupName, key, decision === "grant");
}
