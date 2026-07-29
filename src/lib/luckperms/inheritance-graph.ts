import type { LuckPermsBackup } from "../permissions";
import { getParents } from "./inheritance";

const MAX_VISIBLE_GRAPH_GROUPS = 80;

type InheritanceGraphNode = {
  id: string;
  label: string;
  depth: number;
  missing: boolean;
};

type InheritanceGraphEdge = {
  id: string;
  source: string;
  target: string;
};

export type InheritanceGraph = {
  nodes: InheritanceGraphNode[];
  edges: InheritanceGraphEdge[];
  summary: {
    nodeLimit: number;
    omittedNodes: number;
    truncated: boolean;
  };
};

export function emptyInheritanceGraph(): InheritanceGraph {
  return {
    nodes: [],
    edges: [],
    summary: {
      nodeLimit: MAX_VISIBLE_GRAPH_GROUPS,
      omittedNodes: 0,
      truncated: false,
    },
  };
}

/** Keeps both ends of a provenance route visible when it exceeds the canvas limit. */
export function limitInheritanceGraphPath(
  graph: InheritanceGraph,
): InheritanceGraph {
  if (graph.nodes.length <= MAX_VISIBLE_GRAPH_GROUPS) return graph;

  const startCount = Math.ceil(MAX_VISIBLE_GRAPH_GROUPS / 2);
  const endCount = MAX_VISIBLE_GRAPH_GROUPS - startCount;
  const visibleNodes = [
    ...graph.nodes.slice(0, startCount),
    ...graph.nodes.slice(-endCount),
  ];
  const visibleIds = new Set(visibleNodes.map((node) => node.id));

  return {
    nodes: visibleNodes,
    edges: graph.edges.filter(
      (edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target),
    ),
    summary: {
      nodeLimit: MAX_VISIBLE_GRAPH_GROUPS,
      omittedNodes: graph.nodes.length - visibleNodes.length,
      truncated: true,
    },
  };
}

/** Builds only the active group's ancestor graph so large backups stay navigable. */
export function buildInheritanceGraph(
  backup: LuckPermsBackup,
  groupName: string,
): InheritanceGraph {
  if (!backup.groups[groupName]) return emptyInheritanceGraph();

  const nodes = new Map<string, InheritanceGraphNode>([
    [groupName, { id: groupName, label: groupName, depth: 0, missing: false }],
  ]);
  const edges = new Map<string, InheritanceGraphEdge>();
  const pending = [{ groupName, depth: 0 }];
  const visited = new Set<string>();
  let omittedNodes = 0;

  while (pending.length) {
    const current = pending.shift();
    if (!current || visited.has(current.groupName)) continue;
    visited.add(current.groupName);

    for (const parentName of getParents(backup.groups[current.groupName])) {
      const parent = backup.groups[parentName];
      if (!nodes.has(parentName)) {
        if (nodes.size >= MAX_VISIBLE_GRAPH_GROUPS) {
          omittedNodes += 1;
          continue;
        }
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
    summary: {
      nodeLimit: MAX_VISIBLE_GRAPH_GROUPS,
      omittedNodes,
      truncated: omittedNodes > 0,
    },
  };
}
