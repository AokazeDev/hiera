import { describe, expect, it } from "vitest";
import { getEffectiveNodes, getParents } from "./luckperms";
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
