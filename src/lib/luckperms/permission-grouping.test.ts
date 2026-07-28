import { describe, expect, it } from "vitest";
import { groupPermissions } from "./permission-grouping";

describe("Permission grouping", () => {
  const permissions = [
    { key: "authme.player.login" },
    { key: "authme.player.logout" },
    { key: "authme.admin.reload" },
    { key: "essentials.fly" },
    { key: "*" },
  ];

  it("keeps a flat view in one group", () => {
    const groups = groupPermissions(
      permissions,
      (permission) => permission.key,
      "flat",
    );

    expect(groups).toEqual([{ id: "all", label: "Todos", items: permissions }]);
  });

  it("groups permissions by their plugin prefix", () => {
    const groups = groupPermissions(
      permissions,
      (permission) => permission.key,
      "plugin",
    );

    expect(groups.map((group) => [group.label, group.items.length])).toEqual([
      ["*", 1],
      ["authme", 3],
      ["essentials", 1],
    ]);
  });

  it("groups permissions by the branch before their final segment", () => {
    const groups = groupPermissions(
      permissions,
      (permission) => permission.key,
      "segment",
    );

    expect(groups.map((group) => [group.label, group.items.length])).toEqual([
      ["*", 1],
      ["authme.admin", 1],
      ["authme.player", 2],
      ["essentials", 1],
    ]);
  });

  it("returns no groups for an empty result", () => {
    expect(
      groupPermissions(
        [],
        (permission: { key: string }) => permission.key,
        "plugin",
      ),
    ).toEqual([]);
  });
});
