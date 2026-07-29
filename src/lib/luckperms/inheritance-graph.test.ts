import { describe, expect, it } from "vitest";
import { buildInheritanceGraph } from "./inheritance-graph";

describe("Inheritance graph", () => {
  it("keeps the selected group, its ancestors, and missing references", () => {
    const graph = buildInheritanceGraph(
      {
        groups: {
          member: {
            nodes: [
              { type: "inheritance", key: "group.default", value: true },
              { type: "inheritance", key: "group.missing", value: true },
            ],
          },
          default: {
            nodes: [{ type: "inheritance", key: "group.base", value: true }],
          },
          base: { nodes: [] },
        },
      },
      "member",
    );

    expect(graph.nodes).toEqual([
      { id: "member", label: "member", depth: 0, missing: false },
      { id: "default", label: "default", depth: 1, missing: false },
      { id: "missing", label: "missing", depth: 1, missing: true },
      { id: "base", label: "base", depth: 2, missing: false },
    ]);
    expect(graph.edges.map((edge) => [edge.source, edge.target])).toEqual([
      ["member", "default"],
      ["member", "missing"],
      ["default", "base"],
    ]);
  });

  it("terminates existing inheritance cycles", () => {
    const graph = buildInheritanceGraph(
      {
        groups: {
          alpha: {
            nodes: [{ type: "inheritance", key: "group.beta", value: true }],
          },
          beta: {
            nodes: [{ type: "inheritance", key: "group.alpha", value: true }],
          },
        },
      },
      "alpha",
    );

    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(2);
  });
});
