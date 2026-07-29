import type { LuckPermsBackup } from "../permissions";
import { getParents } from "./inheritance";
import {
  emptyInheritanceGraph,
  type InheritanceGraph,
  limitInheritanceGraphPath,
} from "./inheritance-graph";

/** Builds one deterministic inheritance route to an effective permission's direct source. */
export function buildPermissionProvenanceGraph(
  backup: LuckPermsBackup,
  groupName: string,
  origin: string,
): InheritanceGraph {
  if (!backup.groups[groupName] || !backup.groups[origin]) {
    return emptyInheritanceGraph();
  }

  const pending = [groupName];
  const previous = new Map<string, string | null>([[groupName, null]]);

  while (pending.length) {
    const current = pending.shift();
    if (!current) continue;
    if (current === origin) break;

    for (const parent of getParents(backup.groups[current])) {
      if (!backup.groups[parent] || previous.has(parent)) continue;
      previous.set(parent, current);
      pending.push(parent);
    }
  }

  if (!previous.has(origin)) return emptyInheritanceGraph();

  const path: string[] = [];
  for (
    let current: string | null = origin;
    current;
    current = previous.get(current) ?? null
  ) {
    path.unshift(current);
  }

  return limitInheritanceGraphPath({
    nodes: path.map((name, depth) => ({
      id: name,
      label: name,
      depth,
      missing: false,
    })),
    edges: path.slice(1).map((target, index) => ({
      id: `${path[index]}->${target}`,
      source: path[index],
      target,
    })),
    summary: {
      nodeLimit: Number.POSITIVE_INFINITY,
      omittedNodes: 0,
      truncated: false,
    },
  });
}
