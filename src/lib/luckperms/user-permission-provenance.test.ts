import { describe, expect, it } from "vitest";
import { buildUserPermissionProvenanceGraph } from "./user-permission-provenance";

describe("User permission provenance graph", () => {
  const backup = {
    groups: {
      member: {
        nodes: [{ type: "inheritance", key: "group.default", value: true }],
      },
      default: { nodes: [] },
    },
    users: {
      player: {
        username: "Aokaze",
        nodes: [{ type: "inheritance", key: "group.member", value: true }],
      },
    },
  };

  it("connects the active context, user and one membership route to the source", () => {
    const graph = buildUserPermissionProvenanceGraph(
      backup,
      "player",
      "default",
      { world: "nether" },
    );

    expect(graph.nodes).toMatchObject([
      { id: "active-context", label: "world=nether", kind: "context" },
      { id: "user:player", label: "Aokaze", kind: "user" },
      { id: "group:member", kind: "group" },
      { id: "group:default", kind: "group" },
    ]);
    expect(graph.edges.map((edge) => [edge.source, edge.target])).toEqual([
      ["active-context", "user:player"],
      ["user:player", "group:member"],
      ["group:member", "group:default"],
    ]);
  });

  it("keeps direct user permissions local while still exposing the context", () => {
    const graph = buildUserPermissionProvenanceGraph(
      backup,
      "player",
      "Aokaze",
      {},
    );

    expect(graph.nodes).toHaveLength(2);
    expect(graph.nodes[0]).toMatchObject({ label: "Contexto global" });
    expect(graph.edges).toEqual([
      {
        id: "active-context->user:player",
        source: "active-context",
        target: "user:player",
      },
    ]);
  });
});
