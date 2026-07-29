import { describe, expect, it } from "vitest";
import {
  diagnoseBackup,
  parseLuckPermsBackup,
  serializeLuckPermsBackup,
  validateLuckPermsBackup,
} from "../luckperms";
import type { LuckPermsBackup } from "../permissions";

describe("LuckPerms backup validation", () => {
  it("rejects malformed JSON with a useful location when the parser provides one", () => {
    const result = parseLuckPermsBackup('{\n  "groups": {\n');

    expect(result.backup).toBeNull();
    expect(result.issues[0]).toMatchObject({ path: "$" });
  });

  it("reports missing required group nodes without discarding unknown fields", () => {
    expect(
      validateLuckPermsBackup({
        groups: { default: { retainedByLuckPerms: "yes" } },
      }),
    ).toEqual([
      {
        path: '$.groups."default".nodes',
        message: "Debe ser una lista de nodos.",
      },
    ]);
  });

  it("accepts a backup with complex contexts and preserves it", () => {
    const text = JSON.stringify({
      groups: {
        default: {
          nodes: [
            {
              type: "permission",
              key: "server.chat",
              value: true,
              context: { world: ["nether", "end"], server: "lobby" },
              expiry: 1_800_000_000,
            },
          ],
        },
      },
    });

    expect(parseLuckPermsBackup(text)).toMatchObject({
      backup: {
        groups: {
          default: { nodes: [{ context: { world: ["nether", "end"] } }] },
        },
      },
      issues: [],
    });
  });

  it("validates a large local backup without imposing a group limit", () => {
    const groups = Object.fromEntries(
      Array.from({ length: 500 }, (_, index) => [
        `group-${index}`,
        {
          nodes: [
            {
              type: "permission",
              key: `server.feature.${index}`,
              value: true,
            },
          ],
        },
      ]),
    );

    expect(validateLuckPermsBackup({ groups })).toEqual([]);
  });

  it("keeps node arrays ordered and sorts object keys in stable exports", () => {
    const backup: LuckPermsBackup = {
      tracks: { z: true, a: true },
      groups: {
        zeta: {
          nodes: [
            { type: "permission", key: "z.last", value: true },
            { type: "permission", key: "a.first", value: false },
          ],
        },
      },
      metadata: { z: "last", a: "first" },
    };

    const stable = serializeLuckPermsBackup(backup, true);
    expect(stable.indexOf('"groups"')).toBeLessThan(
      stable.indexOf('"metadata"'),
    );
    expect(stable.indexOf('"a": "first"')).toBeLessThan(
      stable.indexOf('"z": "last"'),
    );
    expect(stable.indexOf('"z.last"')).toBeLessThan(
      stable.indexOf('"a.first"'),
    );
    expect(backup.groups.zeta.nodes[0].key).toBe("z.last");
  });
});

describe("Expanded backup diagnostics", () => {
  it("finds contradictory, repeated and dangerous granted nodes", () => {
    const diagnostics = diagnoseBackup({
      groups: {
        staff: {
          nodes: [
            { type: "permission", key: "server.admin.*", value: true },
            { type: "permission", key: "server.admin.*", value: true },
            { type: "permission", key: "server.admin.*", value: false },
            { type: "meta", key: "meta.rank", value: true },
            { type: "meta", key: "meta.rank", value: true },
            { type: "permission", key: "server.bypass.spawn", value: true },
            { type: "permission", key: "server.shutdown", value: true },
          ],
        },
      },
    });

    expect(diagnostics.contradictoryPermissions).toEqual([
      expect.objectContaining({
        key: "server.admin.*",
        nodeIndexes: [0, 1, 2],
      }),
    ]);
    expect(diagnostics.repeatedNodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "permission",
          key: "server.admin.*",
          nodeIndexes: [0, 1],
        }),
        expect.objectContaining({
          type: "meta",
          key: "meta.rank",
          nodeIndexes: [3, 4],
        }),
      ]),
    );
    expect(diagnostics.dangerousPermissions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "server.admin.*",
          reasons: ["comodín", "administración"],
        }),
        expect.objectContaining({
          key: "server.bypass.spawn",
          reasons: ["bypass"],
        }),
        expect.objectContaining({
          key: "server.shutdown",
          reasons: ["gestión del servidor"],
        }),
      ]),
    );
  });
});
