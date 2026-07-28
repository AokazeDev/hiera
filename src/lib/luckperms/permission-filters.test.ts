import { describe, expect, it } from "vitest";
import type { LuckPermsNode, PermissionEntry } from "../permissions";
import {
  assessPermissionRisk,
  collectPluginPrefixes,
  defaultPermissionFilter,
  extractPluginPrefix,
  filterPermissionNodes,
  filterResolvedPermissions,
  formatRiskLabel,
} from "./permission-filters";

describe("Permission filters", () => {
  const nodes: LuckPermsNode[] = [
    { type: "permission", key: "authme.player.login", value: true },
    { type: "permission", key: "authme.admin.reload", value: true },
    {
      type: "permission",
      key: "authme.admin.*",
      value: true,
    },
    {
      type: "permission",
      key: "authme.bypassantibot",
      value: false,
    },
    {
      type: "permission",
      key: "essentials.fly",
      value: true,
      context: { world: "nether" },
    },
    { type: "inheritance", key: "group.default", value: true },
  ];

  it("extracts the first segment as plugin prefix", () => {
    expect(extractPluginPrefix("authme.player.login")).toBe("authme");
    expect(extractPluginPrefix("*")).toBeNull();
    expect(extractPluginPrefix("")).toBeNull();
  });

  it("collects unique prefixes from permission nodes only", () => {
    expect(collectPluginPrefixes(nodes)).toEqual(["authme", "essentials"]);
  });

  it("filters by granted status", () => {
    const result = filterPermissionNodes(nodes, {
      ...defaultPermissionFilter,
      status: "granted",
    });
    expect(result.map((r) => r.node.key)).toEqual([
      "authme.player.login",
      "authme.admin.reload",
      "authme.admin.*",
      "essentials.fly",
    ]);
  });

  it("filters by denied status", () => {
    const result = filterPermissionNodes(nodes, {
      ...defaultPermissionFilter,
      status: "denied",
    });
    expect(result.map((r) => r.node.key)).toEqual(["authme.bypassantibot"]);
  });

  it("filters by global context only", () => {
    const result = filterPermissionNodes(nodes, {
      ...defaultPermissionFilter,
      context: "global",
    });
    expect(result.map((r) => r.node.key)).not.toContain("essentials.fly");
  });

  it("filters by contextual only", () => {
    const result = filterPermissionNodes(nodes, {
      ...defaultPermissionFilter,
      context: "contextual",
    });
    expect(result.map((r) => r.node.key)).toEqual(["essentials.fly"]);
  });

  it("filters by plugin prefix", () => {
    const result = filterPermissionNodes(nodes, {
      ...defaultPermissionFilter,
      plugin: "essentials",
    });
    expect(result.map((r) => r.node.key)).toEqual(["essentials.fly"]);
  });

  it("returns empty when plugin prefix does not match", () => {
    const result = filterPermissionNodes(nodes, {
      ...defaultPermissionFilter,
      plugin: "worldguard",
    });
    expect(result).toHaveLength(0);
  });

  it("filters resolved permissions by origin", () => {
    const resolved = [
      {
        type: "permission",
        key: "a",
        value: true,
        origin: "group",
        inherited: false,
      },
      {
        type: "permission",
        key: "b",
        value: true,
        origin: "parent",
        inherited: true,
      },
    ] as const;

    expect(
      filterResolvedPermissions(
        resolved as unknown as import("./effective-resolution").ResolvedPermission[],
        { ...defaultPermissionFilter, origin: "direct" },
      ).map((r) => r.key),
    ).toEqual(["a"]);

    expect(
      filterResolvedPermissions(
        resolved as unknown as import("./effective-resolution").ResolvedPermission[],
        { ...defaultPermissionFilter, origin: "inherited" },
      ).map((r) => r.key),
    ).toEqual(["b"]);
  });

  describe("Risk assessment", () => {
    it("marks wildcards and bypass as dangerous", () => {
      expect(assessPermissionRisk("authme.admin.*")).toBe("dangerous");
      expect(assessPermissionRisk("*")).toBe("dangerous");
      expect(assessPermissionRisk("authme.bypassantibot")).toBe("dangerous");
    });

    it("marks admin, reload, purge and debug as caution", () => {
      expect(assessPermissionRisk("authme.admin.reload")).toBe("caution");
      expect(assessPermissionRisk("authme.debug.stats")).toBe("caution");
      expect(assessPermissionRisk("authme.admin.purge")).toBe("caution");
    });

    it("marks player permissions as safe", () => {
      expect(assessPermissionRisk("authme.player.login")).toBe("safe");
      expect(assessPermissionRisk("essentials.fly")).toBe("safe");
    });

    it("uses catalog audience when available", () => {
      const sensitive: PermissionEntry = {
        node: "test",
        description: "",
        audience: ["sensitive"],
        category: "",
      };
      const player: PermissionEntry = {
        node: "test",
        description: "",
        audience: ["player"],
        category: "",
      };

      expect(assessPermissionRisk("test", sensitive)).toBe("dangerous");
      expect(assessPermissionRisk("test", player)).toBe("safe");
    });
  });

  it("filters by risk level", () => {
    const dangerous = filterPermissionNodes(nodes, {
      ...defaultPermissionFilter,
      risk: "dangerous",
    });
    expect(dangerous.map((r) => r.node.key)).toEqual([
      "authme.admin.*",
      "authme.bypassantibot",
    ]);

    const caution = filterPermissionNodes(nodes, {
      ...defaultPermissionFilter,
      risk: "caution",
    });
    expect(caution.map((r) => r.node.key)).toEqual(["authme.admin.reload"]);

    const safe = filterPermissionNodes(nodes, {
      ...defaultPermissionFilter,
      risk: "safe",
    });
    expect(safe.map((r) => r.node.key)).toEqual([
      "authme.player.login",
      "essentials.fly",
    ]);
  });

  it("formats risk labels in Spanish", () => {
    expect(formatRiskLabel("safe")).toBe("Seguro");
    expect(formatRiskLabel("caution")).toBe("Precaución");
    expect(formatRiskLabel("dangerous")).toBe("Peligroso");
  });

  it("ignores non-permission nodes regardless of filters", () => {
    const result = filterPermissionNodes(nodes, defaultPermissionFilter);
    expect(result.some((r) => r.node.type === "inheritance")).toBe(false);
  });
});
