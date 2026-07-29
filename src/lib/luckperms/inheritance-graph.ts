import type { LuckPermsBackup } from "../permissions";
import { getParents } from "./inheritance";

export type InheritanceGraphNode = {
  id: string;
  label: string;
  depth: number;
  missing: boolean;
};

export type InheritanceGraphEdge = {
  id: string;
  source: string;
  target: string;
};

export type InheritanceGraph = {
  nodes: InheritanceGraphNode[];
  edges: InheritanceGraphEdge[];
};

/** Builds only the active group's ancestor graph so large backups stay navigable. */
export function buildInheritanceGraph(
  backup: LuckPermsBackup,
  groupName: string,
): InheritanceGraph {
  if (!backup.groups[groupName]) return { nodes: [], edges: [] };

  const nodes = new Map<string, InheritanceGraphNode>([
    [groupName, { id: groupName, label: groupName, depth: 0, missing: false }],
  ]);
  const edges = new Map<string, InheritanceGraphEdge>();
  const pending = [{ groupName, depth: 0 }];
  const visited = new Set<string>();

  while (pending.length) {
    const current = pending.shift();
    if (!current || visited.has(current.groupName)) continue;
    visited.add(current.groupName);

    for (const parentName of getParents(backup.groups[current.groupName])) {
      const parent = backup.groups[parentName];
      if (!nodes.has(parentName)) {
        nodes.set(parentName, {
          id: parentName,
          label: parentName,
          depth: current.depth + 1,
          missing: !parent,
        });
      }
      edges.set(`${current.groupName}->${parentName}`, {
        id: `${current.groupName}->${parentName}`,
        source: current.groupName,
        target: parentName,
      });
      if (parent)
        pending.push({ groupName: parentName, depth: current.depth + 1 });
    }
  }

  return {
    nodes: Array.from(nodes.values()).sort(
      (left, right) =>
        left.depth - right.depth || left.label.localeCompare(right.label),
    ),
    edges: Array.from(edges.values()),
  };
}
