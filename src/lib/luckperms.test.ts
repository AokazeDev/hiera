import { describe, expect, it } from "vitest";
import {
  addGroupInheritance,
  addUserMembership,
  createGroup,
  deleteGroup,
  getEffectiveNodes,
  getEffectiveUserNodes,
  getGroupReferences,
  getParents,
  getUserMemberships,
  isValidPermissionKey,
  removeDirectPermission,
  removeGroupInheritance,
  removeUserDirectPermission,
  removeUserMembership,
  renameGroup,
  setDirectPermissionValue,
  setUserDirectPermissionValue,
  setUserPrimaryGroup,
  upsertGlobalPermission,
  upsertUserGlobalPermission,
  validateGroupDeletion,
  validateGroupInheritance,
  validateNewGroupName,
  validateUserMembership,
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

describe("Group inheritance editing", () => {
  it("adds an enabled inheritance node for a known parent", () => {
    const changed = addGroupInheritance(backup, "moderator", "cyclic");

    expect(changed.groups.moderator.nodes.at(-1)).toEqual({
      type: "inheritance",
      key: "group.cyclic",
      value: true,
    });
  });

  it("rejects references that do not exist or would create a cycle", () => {
    expect(validateGroupInheritance(backup, "moderator", "missing")).toBe(
      "El grupo padre no existe en el backup.",
    );
    expect(validateGroupInheritance(backup, "default", "moderator")).toBe(
      "Esta herencia crearia un ciclo entre grupos.",
    );
  });

  it("removes only the selected inheritance node", () => {
    const changed = removeGroupInheritance(backup, "moderator", 0);

    expect(changed.groups.moderator.nodes).toHaveLength(2);
    expect(getParents(changed.groups.moderator)).toEqual([]);
  });
});

describe("Group lifecycle editing", () => {
  it("creates an empty group and rejects duplicate or invalid names", () => {
    const changed = createGroup(backup, "builder");

    expect(changed.groups.builder).toEqual({ nodes: [] });
    expect(validateNewGroupName(backup, "moderator")).toBe(
      "Ya existe un grupo con ese nombre.",
    );
    expect(validateNewGroupName(backup, "staff team")).toBe(
      "El nombre del grupo no puede contener espacios.",
    );
  });

  it("renames the group without breaking inheritance or primary-group references", () => {
    const withUser: LuckPermsBackup = {
      ...backup,
      users: {
        "a-user-id": {
          username: "Aokaze",
          primaryGroup: "moderator",
          nodes: [{ type: "inheritance", key: "group.moderator", value: true }],
        },
      },
    };
    const changed = renameGroup(withUser, "moderator", "staff");

    expect(changed.groups.staff).toBeDefined();
    expect(changed.groups.moderator).toBeUndefined();
    expect(changed.users?.["a-user-id"]).toMatchObject({
      primaryGroup: "staff",
      nodes: [{ key: "group.staff" }],
    });
  });

  it("blocks deletion while an active group or user reference remains", () => {
    const withUser: LuckPermsBackup = {
      ...backup,
      users: {
        "a-user-id": {
          primaryGroup: "moderator",
          nodes: [],
        },
      },
    };

    expect(getGroupReferences(withUser, "moderator")).toEqual([
      { source: "a-user-id", kind: "primary-group" },
    ]);
    expect(validateGroupDeletion(withUser, "moderator")).toBe(
      "No se puede eliminar mientras existan herencias o grupos primarios que lo usen.",
    );
    expect(deleteGroup(withUser, "moderator")).toBe(withUser);
  });

  it("deletes an unreferenced group", () => {
    const changed = deleteGroup(createGroup(backup, "builder"), "builder");

    expect(changed.groups.builder).toBeUndefined();
  });
});

describe("User membership editing", () => {
  const withUser: LuckPermsBackup = {
    ...backup,
    groups: {
      ...backup.groups,
      moderator: {
        ...backup.groups.moderator,
        nodes: [
          ...backup.groups.moderator.nodes,
          { type: "permission", key: "server.kick", value: true },
        ],
      },
    },
    users: {
      "a-user-id": {
        username: "Aokaze",
        primaryGroup: "default",
        nodes: [
          { type: "permission", key: "server.chat", value: false },
          {
            type: "inheritance",
            key: "group.moderator",
            value: true,
            context: { server: "lobby" },
          },
        ],
      },
    },
  };

  it("adds a known group membership without changing the user's other nodes", () => {
    const changed = addUserMembership(withUser, "a-user-id", "default");

    expect(
      getUserMemberships(changed.users?.["a-user-id"] ?? { nodes: [] }),
    ).toEqual(["moderator", "default"]);
    expect(changed.users?.["a-user-id"].nodes[1]).toMatchObject({
      context: { server: "lobby" },
    });
  });

  it("rejects a missing group and duplicate membership", () => {
    expect(validateUserMembership(withUser, "a-user-id", "missing")).toBe(
      "El grupo seleccionado no existe en el backup.",
    );
    expect(validateUserMembership(withUser, "a-user-id", "moderator")).toBe(
      "Este usuario ya pertenece a ese grupo.",
    );
  });

  it("removes only the selected membership node", () => {
    const changed = removeUserMembership(withUser, "a-user-id", 1);

    expect(changed.users?.["a-user-id"].nodes).toEqual([
      { type: "permission", key: "server.chat", value: false },
    ]);
  });

  it("sets and clears the primary group only when the group exists", () => {
    const changed = setUserPrimaryGroup(withUser, "a-user-id", "moderator");

    expect(changed.users?.["a-user-id"].primaryGroup).toBe("moderator");
    expect(setUserPrimaryGroup(changed, "a-user-id", "missing")).toBe(changed);
    expect(
      setUserPrimaryGroup(changed, "a-user-id", null).users?.["a-user-id"]
        .primaryGroup,
    ).toBeUndefined();
  });
});

describe("User direct permission editing and resolution", () => {
  const withUser: LuckPermsBackup = {
    ...backup,
    groups: {
      ...backup.groups,
      moderator: {
        ...backup.groups.moderator,
        nodes: [
          ...backup.groups.moderator.nodes,
          { type: "permission", key: "server.kick", value: true },
        ],
      },
    },
    users: {
      "a-user-id": {
        username: "Aokaze",
        nodes: [
          { type: "inheritance", key: "group.moderator", value: true },
          {
            type: "permission",
            key: "server.mute",
            value: false,
            context: { server: "lobby" },
          },
        ],
      },
    },
  };

  it("adds a global direct node without replacing a contextual user node", () => {
    const changed = upsertUserGlobalPermission(
      withUser,
      "a-user-id",
      "server.mute",
      true,
    );

    expect(changed.users?.["a-user-id"].nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "server.mute",
          value: false,
          context: { server: "lobby" },
        }),
        expect.objectContaining({ key: "server.mute", value: true }),
      ]),
    );
  });

  it("edits and removes only the selected user permission node", () => {
    const changed = setUserDirectPermissionValue(
      withUser,
      "a-user-id",
      1,
      true,
    );

    expect(changed.users?.["a-user-id"].nodes[1]).toMatchObject({
      key: "server.mute",
      value: true,
      context: { server: "lobby" },
    });
    expect(
      removeUserDirectPermission(changed, "a-user-id", 1).users?.["a-user-id"]
        .nodes,
    ).toHaveLength(1);
  });

  it("keeps a direct user permission over an assigned group's effective node", () => {
    const changed = upsertUserGlobalPermission(
      withUser,
      "a-user-id",
      "server.chat",
      false,
    );

    expect(getEffectiveUserNodes(changed, "a-user-id")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "server.chat",
          value: false,
          origin: "Aokaze",
          inherited: false,
        }),
        expect.objectContaining({
          key: "server.mute",
          value: false,
          origin: "Aokaze",
          inherited: false,
        }),
        expect.objectContaining({
          key: "server.kick",
          value: true,
          origin: "moderator",
          inherited: true,
        }),
      ]),
    );
  });
});
