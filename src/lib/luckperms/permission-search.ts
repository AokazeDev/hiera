import type { LuckPermsBackup, LuckPermsNode } from "../permissions";

export type PermissionSearchMatch = {
  nodeIndex: number;
  key: string;
  value: boolean;
  context: LuckPermsNode["context"];
};

export type PermissionSearchResult = {
  subject: "group" | "user";
  id: string;
  label: string;
  matches: PermissionSearchMatch[];
};

function findMatchingPermissions(nodes: LuckPermsNode[], query: string) {
  return nodes.flatMap((node, nodeIndex) =>
    node.type === "permission" && node.key.toLocaleLowerCase().includes(query)
      ? [
          {
            nodeIndex,
            key: node.key,
            value: node.value,
            context: node.context,
          },
        ]
      : [],
  );
}

export function searchPermissions(
  backup: LuckPermsBackup,
  search: string,
): PermissionSearchResult[] {
  const query = search.trim().toLocaleLowerCase();
  if (!query) return [];

  const groups = Object.entries(backup.groups).flatMap(([id, group]) => {
    const matches = findMatchingPermissions(group.nodes, query);
    return matches.length
      ? [{ subject: "group" as const, id, label: id, matches }]
      : [];
  });
  const users = Object.entries(backup.users ?? {}).flatMap(([id, user]) => {
    const matches = findMatchingPermissions(user.nodes, query);
    return matches.length
      ? [{ subject: "user" as const, id, label: user.username ?? id, matches }]
      : [];
  });

  return [...groups, ...users];
}
