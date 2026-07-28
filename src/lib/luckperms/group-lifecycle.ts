import type { LuckPermsBackup } from "../permissions";

export type GroupReference = {
  source: string;
  kind: "inheritance" | "primary-group";
};

export function validateNewGroupName(
  backup: LuckPermsBackup,
  groupName: string,
): string | null {
  const name = groupName.trim();
  if (!name) return "Escribe el nombre del grupo.";
  if (/\s/.test(name)) return "El nombre del grupo no puede contener espacios.";
  if (backup.groups[name]) return "Ya existe un grupo con ese nombre.";
  return null;
}

export function createGroup(
  backup: LuckPermsBackup,
  groupName: string,
): LuckPermsBackup {
  const name = groupName.trim();
  if (validateNewGroupName(backup, name)) return backup;

  return {
    ...backup,
    groups: { ...backup.groups, [name]: { nodes: [] } },
  };
}

export function getGroupReferences(
  backup: LuckPermsBackup,
  groupName: string,
): GroupReference[] {
  const inheritanceKey = `group.${groupName}`;
  const groupReferences = Object.entries(backup.groups).flatMap(
    ([name, group]) =>
      group.nodes.some(
        (node) =>
          node.type === "inheritance" &&
          node.value &&
          node.key === inheritanceKey,
      )
        ? [{ source: name, kind: "inheritance" as const }]
        : [],
  );
  const primaryGroupReferences = Object.entries(backup.users ?? {}).flatMap(
    ([uuid, user]) =>
      user.primaryGroup === groupName
        ? [{ source: user.username ?? uuid, kind: "primary-group" as const }]
        : [],
  );

  return [...groupReferences, ...primaryGroupReferences];
}

export function validateGroupDeletion(
  backup: LuckPermsBackup,
  groupName: string,
): string | null {
  if (!backup.groups[groupName]) {
    return "El grupo seleccionado no existe en el backup.";
  }
  const references = getGroupReferences(backup, groupName);
  if (references.length) {
    return "No se puede eliminar mientras existan herencias o grupos primarios que lo usen.";
  }
  return null;
}

export function deleteGroup(
  backup: LuckPermsBackup,
  groupName: string,
): LuckPermsBackup {
  if (validateGroupDeletion(backup, groupName)) return backup;
  const { [groupName]: _, ...groups } = backup.groups;
  return { ...backup, groups };
}

export function renameGroup(
  backup: LuckPermsBackup,
  groupName: string,
  nextGroupName: string,
): LuckPermsBackup {
  const nextName = nextGroupName.trim();
  if (!backup.groups[groupName] || groupName === nextName) return backup;
  if (validateNewGroupName(backup, nextName)) return backup;

  const inheritanceKey = `group.${groupName}`;
  const groups = Object.fromEntries(
    Object.entries(backup.groups).map(([name, group]) => [
      name === groupName ? nextName : name,
      {
        ...group,
        nodes: group.nodes.map((node) =>
          node.type === "inheritance" && node.key === inheritanceKey
            ? { ...node, key: `group.${nextName}` }
            : node,
        ),
      },
    ]),
  );
  const users = backup.users
    ? Object.fromEntries(
        Object.entries(backup.users).map(([uuid, user]) => [
          uuid,
          {
            ...user,
            ...(user.primaryGroup === groupName && { primaryGroup: nextName }),
            nodes: user.nodes.map((node) =>
              node.type === "inheritance" && node.key === inheritanceKey
                ? { ...node, key: `group.${nextName}` }
                : node,
            ),
          },
        ]),
      )
    : undefined;

  return { ...backup, groups, ...(users && { users }) };
}
