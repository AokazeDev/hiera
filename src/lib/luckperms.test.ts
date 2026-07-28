import { describe, expect, it } from "vitest";
import {
  getEffectiveNodes,
  getParents,
  isValidPermissionKey,
  removeDirectPermission,
  setDirectPermissionValue,
  upsertGlobalPermission,
} from "./luckperms";
import type { LuckPermsBackup } from "./permissions";

const backup: LuckPermsBackup = {
  groups: {
    default: {
      nodes: [{ type: "permission", key: "server.chat", value: true }],
    },
    moderator: {
      nodes: [
        { type: "inheritance", key: "group.default", value: true },
        { type: "permission", key: "server.chat", value: false },
        { type: "permission", key: "server.mute", value: true },
      ],
    },
    cyclic: {
      nodes: [{ type: "inheritance", key: "group.cyclic", value: true }],
    },
  },
};

describe("LuckPerms inheritance resolution", () => {
  it("returns only enabled parent groups", () => {
    expect(getParents(backup.groups.moderator)).toEqual(["default"]);
  });

  it("keeps a direct permission over its inherited equivalent", () => {
    expect(getEffectiveNodes(backup, "moderator")).toMatchObject([
      {
        key: "server.chat",
        value: false,
        origin: "moderator",
        inherited: false,
      },
      {
        key: "server.mute",
        value: true,
        origin: "moderator",
        inherited: false,
      },
    ]);
  });

  it("terminates a cyclic inheritance chain", () => {
    expect(getEffectiveNodes(backup, "cyclic")).toEqual([]);
  });
});

describe("Direct permission editing", () => {
  it("adds a global custom permission without changing contextual nodes", () => {
    const withContext: LuckPermsBackup = {
      groups: {
        default: {
          nodes: [
            {
              type: "permission",
              key: "server.chat",
              value: false,
              context: { world: "nether" },
            },
          ],
        },
      },
    };

    expect(
      upsertGlobalPermission(withContext, "default", "server.chat", true),
    ).toMatchObject({
      groups: {
        default: {
          nodes: [
            { key: "server.chat", value: false, context: { world: "nether" } },
            { key: "server.chat", value: true },
          ],
        },
      },
    });
  });

  it("edits and removes only the selected direct permission node", () => {
    const changed = setDirectPermissionValue(backup, "moderator", 2, false);
    expect(changed.groups.moderator.nodes[2]).toMatchObject({
      key: "server.mute",
      value: false,
    });
    expect(
      removeDirectPermission(changed, "moderator", 2).groups.moderator.nodes,
    ).toHaveLength(2);
  });

  it("rejects empty keys and keys with whitespace", () => {
    expect(isValidPermissionKey("plugin.permission")).toBe(true);
    expect(isValidPermissionKey(" ")).toBe(false);
    expect(isValidPermissionKey("plugin permission")).toBe(false);
  });
});
