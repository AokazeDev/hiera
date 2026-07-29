import type { LuckPermsBackup } from "../permissions";
import type { PermissionContext } from "./permission-contexts";
import { buildPermissionProvenanceGraph } from "./permission-provenance";
import { getUserMemberships } from "./user-memberships";

type UserPermissionProvenanceNode = {
  id: string;
  label: string;
  kind: "context" | "group" | "user";
  depth: number;
};

export type UserPermissionProvenanceGraph = {
  nodes: UserPermissionProvenanceNode[];
  edges: Array<{ id: string; source: string; target: string }>;
  summary: {
    nodeLimit: number;
    omittedNodes: number;
    truncated: boolean;
  };
};

function formatActiveContext(activeContext: PermissionContext): string {
  const entries = Object.entries(activeContext).sort(([left], [right]) =>
    left.localeCompare(right),
  );
  if (entries.length === 0) return "Contexto global";

  return entries
    .map(
      ([key, value]) =>
        `${key}=${Array.isArray(value) ? value.join("|") : value}`,
    )
    .join(" · ");
}

/** Builds one user, context and membership route without mounting the full backup. */
export function buildUserPermissionProvenanceGraph(
  backup: LuckPermsBackup,
  userId: string,
  origin: string,
  activeContext: PermissionContext,
): UserPermissionProvenanceGraph {
  const user = backup.users?.[userId];
  if (!user) {
    return {
      nodes: [],
      edges: [],
      summary: { nodeLimit: 80, omittedNodes: 0, truncated: false },
    };
  }

  const userIdInGraph = `user:${userId}`;
  const contextId = "active-context";
  const nodes: UserPermissionProvenanceNode[] = [
    {
      id: contextId,
      label: formatActiveContext(activeContext),
      kind: "context",
      depth: 0,
    },
    {
      id: userIdInGraph,
      label: user.username ?? userId,
      kind: "user",
      depth: 1,
    },
  ];
  const edges = [
    {
      id: `${contextId}->${userIdInGraph}`,
      source: contextId,
      target: userIdInGraph,
    },
  ];

  if (origin === (user.username ?? userId)) {
    return {
      nodes,
      edges,
      summary: { nodeLimit: 80, omittedNodes: 0, truncated: false },
    };
  }

  const route = getUserMemberships(user)
    .map((membership) =>
      buildPermissionProvenanceGraph(backup, membership, origin),
    )
    .find((candidate) => candidate.nodes.length > 0);
  if (!route) {
    return {
      nodes,
      edges,
      summary: { nodeLimit: 80, omittedNodes: 0, truncated: false },
    };
  }

  const groupNodes = route.nodes.map((node) => ({
    id: `group:${node.id}`,
    label: node.label,
    kind: "group" as const,
    depth: node.depth + 2,
  }));
  const firstGroup = groupNodes[0];
  if (firstGroup) {
    edges.push({
      id: `${userIdInGraph}->${firstGroup.id}`,
      source: userIdInGraph,
      target: firstGroup.id,
    });
  }

  return {
    nodes: [...nodes, ...groupNodes],
    edges: [
      ...edges,
      ...route.edges.map((edge) => ({
        id: `group:${edge.id}`,
        source: `group:${edge.source}`,
        target: `group:${edge.target}`,
      })),
    ],
    summary: route.summary,
  };
}
