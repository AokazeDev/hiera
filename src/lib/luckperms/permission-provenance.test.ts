import { describe, expect, it } from "vitest";
import { buildPermissionProvenanceGraph } from "./permission-provenance";

describe("Permission provenance graph", () => {
  const backup = {
    groups: {
      member: {
        nodes: [
          { type: "inheritance", key: "group.default", value: true },
          { type: "inheritance", key: "group.fallback", value: true },
        ],
      },
      default: {
        nodes: [{ type: "inheritance", key: "group.base", value: true }],
      },
      fallback: {
        nodes: [{ type: "inheritance", key: "group.base", value: true }],
      },
      base: { nodes: [] },
    },
  };

  it("keeps only the first inheritance route to the direct origin", () => {
    const graph = buildPermissionProvenanceGraph(backup, "member", "base");

    expect(graph.nodes.map((node) => node.id)).toEqual([
      "member",
      "default",
      "base",
    ]);
    expect(graph.edges.map((edge) => [edge.source, edge.target])).toEqual([
      ["member", "default"],
      ["default", "base"],
    ]);
  });

  it("represents a direct permission without inheritance edges", () => {
    const graph = buildPermissionProvenanceGraph(backup, "member", "member");

    expect(graph.nodes.map((node) => node.id)).toEqual(["member"]);
    expect(graph.edges).toEqual([]);
  });

  it("does not invent a route when the origin is not inherited", () => {
    expect(
      buildPermissionProvenanceGraph(backup, "member", "unrelated"),
    ).toMatchObject({ nodes: [], edges: [], summary: { truncated: false } });
  });

  it("keeps both ends of an oversized route visible", () => {
    const groups = Object.fromEntries(
      Array.from({ length: 81 }, (_, index) => [
        `group-${index}`,
        {
          nodes:
            index === 80
              ? []
              : [
                  {
                    type: "inheritance",
                    key: `group.group-${index + 1}`,
                    value: true,
                  },
                ],
        },
      ]),
    );
    const graph = buildPermissionProvenanceGraph(
      { groups },
      "group-0",
      "group-80",
    );

    expect(graph.nodes).toHaveLength(80);
    expect(graph.nodes.at(0)?.id).toBe("group-0");
    expect(graph.nodes.at(-1)?.id).toBe("group-80");
    expect(graph.summary).toMatchObject({ truncated: true, omittedNodes: 1 });
  });
});
