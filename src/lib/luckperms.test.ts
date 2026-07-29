import { describe, expect, it } from "vitest";
import {
  addGroupInheritance,
  addUserMembership,
  applyPermissionBatch,
  compareGroups,
  createGroup,
  deleteGroup,
  diagnoseBackup,
  diffBackups,
  emptyBackupHistory,
  getEffectiveNodes,
  getEffectiveUserNodes,
  getGroupReferences,
  getParents,
  getUserMemberships,
  inspectNodes,
  isValidPermissionKey,
  previewPermissionBatch,
  recordBackupChange,
  redoBackupChange,
  removeDirectPermission,
  removeGroupInheritance,
  removeUserDirectPermission,
  removeUserMembership,
  renameGroup,
  searchPermissions,
  setDirectPermissionValue,
  setUserDirectPermissionValue,
  setUserPrimaryGroup,
  transferGroupPermission,
  undoBackupChange,
  upsertGlobalPermission,
  upsertUserGlobalPermission,
  validateGroupDeletion,
  validateGroupInheritance,
  validateGroupPermissionTransfer,
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

describe("LuckPerms node inspection", () => {
  it("keeps every node type and exposes its context and extra fields", () => {
    expect(
      inspectNodes([
        {
          type: "prefix",
          key: "prefix.100.staff",
          value: true,
          context: { server: "lobby" },
          priority: 100,
        },
        { type: "custom-node", key: "custom.value", value: false },
      ]),
    ).toEqual([
      {
        index: 0,
        type: "prefix",
        typeLabel: "Prefijo",
        key: "prefix.100.staff",
        value: true,
        context: [["server", "lobby"]],
        attributes: [["priority", "100"]],
      },
      {
        index: 1,
        type: "custom-node",
        typeLabel: "Tipo no reconocido: custom-node",
        key: "custom.value",
        value: false,
        context: [],
        attributes: [],
      },
    ]);
  });
});

describe("Permission search", () => {
  it("finds direct permissions in groups and users without matching inheritance", () => {
    expect(
      searchPermissions(
        {
          groups: {
            moderator: {
              nodes: [
                { type: "permission", key: "server.mute", value: true },
                { type: "inheritance", key: "group.muted", value: true },
              ],
            },
          },
          users: {
            user: {
              username: "Aokaze",
              nodes: [
                {
                  type: "permission",
                  key: "server.mute",
                  value: false,
                  context: { world: "nether" },
                },
              ],
            },
          },
        },
        "MUTE",
      ),
    ).toEqual([
      {
        subject: "group",
        id: "moderator",
        label: "moderator",
        matches: [
          { nodeIndex: 0, key: "server.mute", value: true, context: undefined },
        ],
      },
      {
        subject: "user",
        id: "user",
        label: "Aokaze",
        matches: [
          {
            nodeIndex: 0,
            key: "server.mute",
            value: false,
            context: { world: "nether" },
          },
        ],
      },
    ]);
  });

  it("does not return results for an empty search", () => {
    expect(searchPermissions(backup, "  ")).toEqual([]);
  });
});

describe("Backup diagnostics", () => {
  it("finds duplicate permissions, missing group references, and inherited cycles", () => {
    const diagnostics = diagnoseBackup({
      groups: {
        default: {
          nodes: [
            { type: "permission", key: "server.chat", value: true },
            { type: "permission", key: "server.chat", value: false },
            { type: "inheritance", key: "group.missing", value: true },
            { type: "inheritance", key: "group.staff", value: true },
          ],
        },
        staff: {
          nodes: [{ type: "inheritance", key: "group.default", value: true }],
        },
      },
      users: {
        user: {
          primaryGroup: "absent",
          nodes: [{ type: "inheritance", key: "group.unknown", value: true }],
        },
      },
    });

    expect(diagnostics.duplicatePermissions).toEqual([
      {
        owner: "group",
        ownerId: "default",
        key: "server.chat",
        nodeIndexes: [0, 1],
      },
    ]);
    expect(diagnostics.missingGroupReferences).toHaveLength(3);
    expect(diagnostics.inheritanceCycles).toEqual([
      { groups: ["default", "staff", "default"] },
    ]);
  });

  it("does not treat contextual permissions as duplicates of global permissions", () => {
    const diagnostics = diagnoseBackup({
      groups: {
        default: {
          nodes: [
            { type: "permission", key: "server.chat", value: true },
            {
              type: "permission",
              key: "server.chat",
              value: false,
              context: { world: "nether" },
            },
          ],
        },
      },
    });

    expect(diagnostics.duplicatePermissions).toEqual([]);
  });
});

describe("Edit history", () => {
  it("undos and redoes a labelled backup change", () => {
    const changed = createGroup(backup, "builder");
    const history = recordBackupChange(
      emptyBackupHistory,
      backup,
      "Crear grupo builder",
    );
    const undone = undoBackupChange(history, changed);

    expect(undone?.backup).toBe(backup);
    expect(undone?.history.future).toHaveLength(1);
    expect(undone?.history.future[0].label).toBe("Crear grupo builder");

    const redone = undone && redoBackupChange(undone.history, undone.backup);

    expect(redone?.backup).toBe(changed);
    expect(redone?.history.past.at(-1)?.label).toBe("Crear grupo builder");
  });

  it("clears redo entries when recording a new change", () => {
    const changed = createGroup(backup, "builder");
    const undone = undoBackupChange(
      recordBackupChange(emptyBackupHistory, backup, "Crear grupo builder"),
      changed,
    );
    const next = recordBackupChange(
      undone?.history ?? emptyBackupHistory,
      undone?.backup ?? backup,
      "Cambiar permiso",
    );

    expect(next.future).toEqual([]);
    expect(next.past).toHaveLength(1);
    expect(next.past[0].label).toBe("Cambiar permiso");
  });
});

describe("Backup export diff", () => {
  it("describes group, user and node changes against the imported backup", () => {
    const changed = {
      groups: {
        default: {
          nodes: [{ type: "permission", key: "server.chat", value: false }],
        },
        builder: {
          nodes: [{ type: "permission", key: "server.build", value: true }],
        },
      },
      users: {
        "user-id": {
          primaryGroup: "builder",
          nodes: [{ type: "permission", key: "server.fly", value: true }],
        },
      },
      metadata: { format: "v2" },
    } satisfies LuckPermsBackup;
    const diff = diffBackups(backup, changed);

    expect(diff.groups).toEqual([
      expect.objectContaining({ id: "builder", kind: "added" }),
      expect.objectContaining({ id: "cyclic", kind: "removed" }),
      expect.objectContaining({
        id: "default",
        kind: "changed",
        nodeChanges: [
          {
            kind: "removed",
            node: { type: "permission", key: "server.chat", value: true },
          },
          {
            kind: "added",
            node: { type: "permission", key: "server.chat", value: false },
          },
        ],
      }),
      expect.objectContaining({ id: "moderator", kind: "removed" }),
    ]);
    expect(diff.users).toEqual([
      expect.objectContaining({ id: "user-id", kind: "added" }),
    ]);
    expect(diff.rootChanges).toEqual([
      { field: "metadata", before: undefined, after: { format: "v2" } },
    ]);
    expect(diff.changeCount).toBeGreaterThan(0);
  });

  it("ignores object key order and reports no change for an equal backup", () => {
    expect(
      diffBackups(
        backup,
        JSON.parse(JSON.stringify(backup)) as LuckPermsBackup,
      ),
    ).toMatchObject({ groups: [], users: [], rootChanges: [], changeCount: 0 });
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

describe("Group comparison", () => {
  it("separates direct and effective differences while preserving origin", () => {
    const comparison = compareGroups(
      {
        groups: {
          base: {
            nodes: [
              { type: "permission", key: "server.chat", value: true },
              { type: "permission", key: "server.fly", value: true },
            ],
          },
          left: {
            nodes: [
              { type: "inheritance", key: "group.base", value: true },
              { type: "permission", key: "server.mute", value: true },
              {
                type: "permission",
                key: "server.home",
                value: true,
                context: { world: "nether" },
              },
            ],
          },
          right: {
            nodes: [
              { type: "permission", key: "server.mute", value: false },
              { type: "permission", key: "server.home", value: true },
            ],
          },
        },
      },
      "left",
      "right",
    );

    expect(comparison.direct).toEqual([
      {
        key: "server.home",
        context: [["world", "nether"]],
        left: {
          type: "permission",
          key: "server.home",
          value: true,
          context: { world: "nether" },
        },
        right: undefined,
      },
      {
        key: "server.home",
        context: [],
        left: undefined,
        right: { type: "permission", key: "server.home", value: true },
      },
      {
        key: "server.mute",
        context: [],
        left: { type: "permission", key: "server.mute", value: true },
        right: { type: "permission", key: "server.mute", value: false },
      },
    ]);
    expect(comparison.effective).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "server.chat",
          left: expect.objectContaining({ origin: "base", inherited: true }),
          right: undefined,
        }),
        expect.objectContaining({
          key: "server.mute",
          left: expect.objectContaining({ origin: "left", inherited: false }),
          right: expect.objectContaining({ origin: "right", inherited: false }),
        }),
      ]),
    );
  });
});

describe("Group permission transfers", () => {
  const transferBackup: LuckPermsBackup = {
    groups: {
      source: {
        nodes: [
          {
            type: "permission",
            key: "server.mute",
            value: false,
            context: { world: "nether" },
            expiry: 123,
          },
          { type: "permission", key: "server.chat", value: true },
        ],
      },
      target: {
        nodes: [{ type: "permission", key: "server.kick", value: true }],
      },
    },
  };

  it("copies the selected permission with its context and attributes", () => {
    const changed = transferGroupPermission(
      transferBackup,
      "source",
      0,
      "target",
      "copy",
    );

    expect(changed.groups.source.nodes).toHaveLength(2);
    expect(changed.groups.target.nodes.at(-1)).toEqual({
      type: "permission",
      key: "server.mute",
      value: false,
      context: { world: "nether" },
      expiry: 123,
    });
  });

  it("moves only the selected permission and preserves the remaining source nodes", () => {
    const changed = transferGroupPermission(
      transferBackup,
      "source",
      0,
      "target",
      "move",
    );

    expect(changed.groups.source.nodes).toEqual([
      { type: "permission", key: "server.chat", value: true },
    ]);
    expect(changed.groups.target.nodes.at(-1)).toMatchObject({
      key: "server.mute",
      context: { world: "nether" },
    });
  });

  it("rejects a target with the same permission in the same context", () => {
    const withDuplicate: LuckPermsBackup = {
      ...transferBackup,
      groups: {
        ...transferBackup.groups,
        target: {
          nodes: [
            {
              type: "permission",
              key: "server.mute",
              value: true,
              context: { world: "nether" },
            },
          ],
        },
      },
    };

    expect(
      validateGroupPermissionTransfer(withDuplicate, "source", 0, "target"),
    ).toBe("El grupo de destino ya tiene este permiso en el mismo contexto.");
    expect(
      transferGroupPermission(withDuplicate, "source", 0, "target", "copy"),
    ).toBe(withDuplicate);
  });

  it("rejects dropping a permission back into its source group", () => {
    expect(
      validateGroupPermissionTransfer(transferBackup, "source", 0, "source"),
    ).toBe("Elige un grupo distinto al de origen.");
  });
});

describe("Permission batch application", () => {
  const batchBackup: LuckPermsBackup = {
    groups: {
      default: {
        nodes: [
          { type: "permission", key: "authme.player.login", value: true },
          {
            type: "permission",
            key: "authme.player.register",
            value: false,
            context: { world: "nether" },
          },
          { type: "permission", key: "authme.player.logout", value: false },
        ],
      },
      member: { nodes: [] },
    },
  };

  it("previews additions per group without treating contextual nodes as global duplicates", () => {
    expect(
      previewPermissionBatch(
        batchBackup,
        ["default", "member"],
        [
          "authme.player.login",
          "authme.player.register",
          "authme.player.logout",
        ],
      ),
    ).toMatchObject({
      additionCount: 4,
      targets: [
        {
          groupName: "default",
          additions: ["authme.player.register"],
          alreadyPresent: ["authme.player.login", "authme.player.logout"],
        },
        {
          groupName: "member",
          additions: [
            "authme.player.login",
            "authme.player.register",
            "authme.player.logout",
          ],
        },
      ],
    });
  });

  it("applies one selection to multiple groups without changing existing nodes", () => {
    const changed = applyPermissionBatch(
      batchBackup,
      ["default", "member"],
      ["authme.player.login", "authme.player.register", "authme.player.logout"],
    );

    expect(changed.groups.default.nodes).toEqual([
      { type: "permission", key: "authme.player.login", value: true },
      {
        type: "permission",
        key: "authme.player.register",
        value: false,
        context: { world: "nether" },
      },
      { type: "permission", key: "authme.player.logout", value: false },
      { type: "permission", key: "authme.player.register", value: true },
    ]);
    expect(changed.groups.member.nodes).toEqual([
      { type: "permission", key: "authme.player.login", value: true },
      { type: "permission", key: "authme.player.register", value: true },
      { type: "permission", key: "authme.player.logout", value: true },
    ]);
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
