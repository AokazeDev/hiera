import type { LuckPermsBackup, LuckPermsNode } from "../permissions";

export type PermissionTransferMode = "copy" | "move";

export type PermissionTransferPreview = {
  node: LuckPermsNode;
  sourceGroup: string;
  targetGroup: string;
  mode: PermissionTransferMode;
};

function hasSameContext(first: LuckPermsNode, second: LuckPermsNode): boolean {
  const serializeContext = (node: LuckPermsNode) =>
    JSON.stringify(
      Object.entries(node.context ?? {}).sort(([firstKey], [secondKey]) =>
        firstKey.localeCompare(secondKey),
      ),
    );

  return serializeContext(first) === serializeContext(second);
}

export function validateGroupPermissionTransfer(
  backup: LuckPermsBackup,
  sourceGroup: string,
  sourceNodeIndex: number,
  targetGroup: string,
): string | null {
  const source = backup.groups[sourceGroup];
  const target = backup.groups[targetGroup];
  const node = source?.nodes[sourceNodeIndex];

  if (!source || !target || !node || node.type !== "permission") {
    return "El permiso o el grupo de destino ya no están disponibles.";
  }
  if (sourceGroup === targetGroup) {
    return "Elige un grupo distinto al de origen.";
  }
  if (
    target.nodes.some(
      (targetNode) =>
        targetNode.type === "permission" &&
        targetNode.key === node.key &&
        hasSameContext(targetNode, node),
    )
  ) {
    return "El grupo de destino ya tiene este permiso en el mismo contexto.";
  }

  return null;
}

export function previewGroupPermissionTransfer(
  backup: LuckPermsBackup,
  sourceGroup: string,
  sourceNodeIndex: number,
  targetGroup: string,
  mode: PermissionTransferMode,
): PermissionTransferPreview | null {
  if (
    validateGroupPermissionTransfer(
      backup,
      sourceGroup,
      sourceNodeIndex,
      targetGroup,
    )
  ) {
    return null;
  }

  return {
    node: backup.groups[sourceGroup].nodes[sourceNodeIndex],
    sourceGroup,
    targetGroup,
    mode,
  };
}

export function transferGroupPermission(
  backup: LuckPermsBackup,
  sourceGroup: string,
  sourceNodeIndex: number,
  targetGroup: string,
  mode: PermissionTransferMode,
): LuckPermsBackup {
  const preview = previewGroupPermissionTransfer(
    backup,
    sourceGroup,
    sourceNodeIndex,
    targetGroup,
    mode,
  );
  if (!preview) return backup;

  const source = backup.groups[sourceGroup];
  const target = backup.groups[targetGroup];
  const targetNodes = [...target.nodes, { ...preview.node }];
  const sourceNodes =
    mode === "move"
      ? source.nodes.filter((_, index) => index !== sourceNodeIndex)
      : source.nodes;

  return {
    ...backup,
    groups: {
      ...backup.groups,
      [sourceGroup]: { ...source, nodes: sourceNodes },
      [targetGroup]: { ...target, nodes: targetNodes },
    },
  };
}
