import { describe, expect, it } from "vitest";
import { sortPermissions } from "./permission-sorting";

describe("Permission sorting", () => {
  const catalog = new Map([
    [
      "authme.player.login",
      {
        node: "authme.player.login",
        category: "Jugadores",
        description: "Inicia sesión.",
        audience: ["player"] as const,
      },
    ],
    [
      "authme.admin.reload",
      {
        node: "authme.admin.reload",
        category: "Administración",
        description: "Recarga el plugin.",
        audience: ["admin", "sensitive"] as const,
      },
    ],
  ]);
  const permissions = [
    { type: "permission", key: "custom.zeta", value: false },
    { type: "permission", key: "authme.player.login", value: true },
    { type: "permission", key: "authme.admin.reload", value: true },
  ];

  it("sorts by name without mutating the source", () => {
    const sorted = sortPermissions(
      permissions,
      "name",
      (permission) => permission,
      catalog,
    );

    expect(sorted.map((permission) => permission.key)).toEqual([
      "authme.admin.reload",
      "authme.player.login",
      "custom.zeta",
    ]);
    expect(permissions[0].key).toBe("custom.zeta");
  });

  it("places granted permissions before denied permissions", () => {
    expect(
      sortPermissions(
        permissions,
        "status",
        (permission) => permission,
        catalog,
      ).map((permission) => permission.key),
    ).toEqual(["authme.admin.reload", "authme.player.login", "custom.zeta"]);
  });

  it("uses documented categories and leaves custom permissions last", () => {
    expect(
      sortPermissions(
        permissions,
        "category",
        (permission) => permission,
        catalog,
      ).map((permission) => permission.key),
    ).toEqual(["authme.admin.reload", "authme.player.login", "custom.zeta"]);
  });

  it("uses catalog audiences for recommendations and effective origins", () => {
    expect(
      sortPermissions(
        permissions,
        "recommendation",
        (permission) => permission,
        catalog,
      ).map((permission) => permission.key),
    ).toEqual(["authme.player.login", "authme.admin.reload", "custom.zeta"]);
    expect(
      sortPermissions(
        [
          { ...permissions[0], origin: "staff", inherited: true },
          { ...permissions[1], origin: "member", inherited: false },
        ],
        "origin",
        (permission) => permission,
        catalog,
      ).map((permission) => permission.key),
    ).toEqual(["authme.player.login", "custom.zeta"]);
  });
});
