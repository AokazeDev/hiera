"use client";

import {
  Background,
  Controls,
  type Edge,
  Handle,
  type Node,
  type NodeProps,
  Panel,
  Position,
  ReactFlow,
} from "@xyflow/react";
import {
  Check,
  ChevronDown,
  CirclePlus,
  Copy,
  FileUp,
  MoreHorizontal,
  Search,
  ShieldMinus,
  Trash2,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { LuckPermsBackup } from "@/lib/permissions";

type GroupNodeData = {
  groupName: string;
  permissionCount: number;
  inheritanceCount: number;
  permissions: Array<{
    key: string;
    value: boolean;
    nodeIndex: number;
    contextCount: number;
    context?: Record<string, string | string[]>;
  }>;
  selected: boolean;
  onSelect: (groupName: string) => void;
  onAddPermission: (groupName: string, key: string) => void;
  onSetPermissionValue: (
    groupName: string,
    nodeIndex: number,
    value: boolean,
  ) => void;
  onRemovePermission: (groupName: string, nodeIndex: number) => void;
  onRequestContext: (
    groupName: string,
    nodeIndex: number,
    context: Record<string, string | string[]> | undefined,
  ) => void;
  onPrepareTransfer: (groupName: string, nodeIndex: number) => void;
  onRequestRename: (groupName: string) => void;
  onRequestDelete: (groupName: string) => void;
};

type GroupFlowNode = Node<GroupNodeData, "group">;

function GroupCanvasNode({ data }: NodeProps<GroupFlowNode>) {
  const [query, setQuery] = useState("");
  const [isAddingPermission, setIsAddingPermission] = useState(false);
  const [newPermission, setNewPermission] = useState("");
  const visiblePermissions = data.permissions
    .filter((permission) =>
      permission.key.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, query ? 12 : 5);

  function addPermission(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newPermission.trim()) return;
    data.onAddPermission(data.groupName, newPermission.trim());
    setNewPermission("");
    setIsAddingPermission(false);
  }

  return (
    <article
      className={`permission-canvas-group${data.selected ? " is-selected" : ""}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        aria-label={`Heredar en ${data.groupName}`}
      />
      <header>
        <button
          type="button"
          className="permission-canvas-group-title"
          onClick={() => data.onSelect(data.groupName)}
        >
          <span className="group-mark" />
          <strong>{data.groupName}</strong>
        </button>
        <details className="node-context-menu">
          <summary aria-label={`Acciones para ${data.groupName}`}>
            <MoreHorizontal size={16} aria-hidden="true" />
          </summary>
          <div>
            <button type="button" onClick={() => setIsAddingPermission(true)}>
              <CirclePlus size={13} aria-hidden="true" /> Añadir permiso
            </button>
            <button
              type="button"
              onClick={() => data.onRequestRename(data.groupName)}
            >
              Renombrar grupo
            </button>
            <button
              type="button"
              className="node-context-danger"
              onClick={() => data.onRequestDelete(data.groupName)}
            >
              <Trash2 size={13} aria-hidden="true" /> Eliminar grupo
            </button>
          </div>
        </details>
      </header>
      <p className="permission-canvas-summary">
        {data.permissionCount} directos <span aria-hidden="true">/</span>{" "}
        {data.inheritanceCount} herencias
      </p>
      <label className="permission-canvas-search">
        <Search size={12} aria-hidden="true" />
        <span className="sr-only">Buscar permiso en {data.groupName}</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar en el grupo"
        />
      </label>
      {isAddingPermission && (
        <form className="permission-canvas-add" onSubmit={addPermission}>
          <label>
            <span className="sr-only">Nodo de permiso</span>
            <input
              value={newPermission}
              onChange={(event) => setNewPermission(event.target.value)}
              placeholder="plugin.permission"
            />
          </label>
          <button type="submit" aria-label="Conceder permiso">
            <Check size={14} aria-hidden="true" />
          </button>
        </form>
      )}
      <div className="permission-canvas-permissions">
        {visiblePermissions.map((permission) => (
          <div key={`${permission.nodeIndex}-${permission.key}`}>
            <code className={permission.value ? "is-granted" : "is-denied"}>
              {permission.key}
            </code>
            {permission.contextCount > 0 && (
              <small>@{permission.contextCount}</small>
            )}
            <details className="node-context-menu permission-context-menu">
              <summary aria-label={`Operaciones para ${permission.key}`}>
                <ChevronDown size={12} aria-hidden="true" />
              </summary>
              <div>
                <button
                  type="button"
                  onClick={() =>
                    data.onSetPermissionValue(
                      data.groupName,
                      permission.nodeIndex,
                      true,
                    )
                  }
                >
                  Conceder
                </button>
                <button
                  type="button"
                  onClick={() =>
                    data.onSetPermissionValue(
                      data.groupName,
                      permission.nodeIndex,
                      false,
                    )
                  }
                >
                  Denegar
                </button>
                <button
                  type="button"
                  onClick={() =>
                    data.onRequestContext(
                      data.groupName,
                      permission.nodeIndex,
                      permission.context,
                    )
                  }
                >
                  Editar contexto
                </button>
                <button
                  type="button"
                  onClick={() =>
                    data.onPrepareTransfer(data.groupName, permission.nodeIndex)
                  }
                >
                  <Copy size={12} aria-hidden="true" /> Copiar, mover o cambiar
                </button>
                <button
                  type="button"
                  className="node-context-danger"
                  onClick={() =>
                    data.onRemovePermission(
                      data.groupName,
                      permission.nodeIndex,
                    )
                  }
                >
                  <Trash2 size={12} aria-hidden="true" /> Eliminar permiso
                </button>
              </div>
            </details>
          </div>
        ))}
        {visiblePermissions.length === 0 && (
          <p>{query ? "Sin coincidencias." : "Sin permisos directos."}</p>
        )}
        {data.permissions.length > visiblePermissions.length && !query && (
          <small>
            + {data.permissions.length - visiblePermissions.length} permisos
          </small>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        aria-label={`Crear una herencia desde ${data.groupName}`}
      />
    </article>
  );
}

type UserNodeData = {
  userId: string;
  displayName: string;
  primaryGroup: string | null;
  memberships: string[];
  permissionCount: number;
  permissions: Array<{
    key: string;
    value: boolean;
    nodeIndex: number;
    contextCount: number;
    context?: Record<string, string | string[]>;
  }>;
  selected: boolean;
  onSelect: (userId: string) => void;
  onRequestPrimaryGroup: (userId: string, currentGroup: string | null) => void;
  onAddPermission: (userId: string, key: string) => void;
  onSetPermissionValue: (
    userId: string,
    nodeIndex: number,
    value: boolean,
  ) => void;
  onRemovePermission: (userId: string, nodeIndex: number) => void;
  onRequestContext: (
    userId: string,
    nodeIndex: number,
    context: Record<string, string | string[]> | undefined,
  ) => void;
};

type UserFlowNode = Node<UserNodeData, "user">;

function UserCanvasNode({ data }: NodeProps<UserFlowNode>) {
  const [isAddingPermission, setIsAddingPermission] = useState(false);
  const [newPermission, setNewPermission] = useState("");

  function addPermission(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newPermission.trim()) return;
    data.onAddPermission(data.userId, newPermission.trim());
    setNewPermission("");
    setIsAddingPermission(false);
  }

  return (
    <article
      className={`permission-canvas-user${data.selected ? " is-selected" : ""}`}
    >
      <header>
        <button
          type="button"
          className="permission-canvas-group-title"
          onClick={() => data.onSelect(data.userId)}
        >
          <UserRound size={14} aria-hidden="true" />
          <strong>{data.displayName}</strong>
        </button>
        <details className="node-context-menu">
          <summary aria-label={`Acciones para ${data.displayName}`}>
            <MoreHorizontal size={16} aria-hidden="true" />
          </summary>
          <div>
            <button
              type="button"
              onClick={() =>
                data.onRequestPrimaryGroup(data.userId, data.primaryGroup)
              }
            >
              Cambiar grupo primario
            </button>
            <button type="button" onClick={() => setIsAddingPermission(true)}>
              <CirclePlus size={13} aria-hidden="true" /> Añadir permiso
            </button>
          </div>
        </details>
      </header>
      <p className="permission-canvas-summary">
        {data.primaryGroup
          ? `primario: ${data.primaryGroup}`
          : "sin grupo primario"}
      </p>
      <div className="permission-canvas-user-memberships">
        {data.memberships.length ? (
          data.memberships.map((membership) => (
            <span key={membership}>{membership}</span>
          ))
        ) : (
          <span>sin membresías directas</span>
        )}
      </div>
      <small className="permission-canvas-user-summary">
        {data.permissionCount} permisos directos
      </small>
      {isAddingPermission && (
        <form className="permission-canvas-add" onSubmit={addPermission}>
          <label>
            <span className="sr-only">Nodo de permiso</span>
            <input
              value={newPermission}
              onChange={(event) => setNewPermission(event.target.value)}
              placeholder="plugin.permission"
            />
          </label>
          <button type="submit" aria-label="Conceder permiso">
            <Check size={14} aria-hidden="true" />
          </button>
        </form>
      )}
      <div className="permission-canvas-permissions">
        {data.permissions.slice(0, 3).map((permission) => (
          <div key={`${permission.nodeIndex}-${permission.key}`}>
            <code className={permission.value ? "is-granted" : "is-denied"}>
              {permission.key}
            </code>
            {permission.contextCount > 0 && (
              <small>@{permission.contextCount}</small>
            )}
            <details className="node-context-menu permission-context-menu">
              <summary aria-label={`Operaciones para ${permission.key}`}>
                <ChevronDown size={12} aria-hidden="true" />
              </summary>
              <div>
                <button
                  type="button"
                  onClick={() =>
                    data.onSetPermissionValue(
                      data.userId,
                      permission.nodeIndex,
                      true,
                    )
                  }
                >
                  Conceder
                </button>
                <button
                  type="button"
                  onClick={() =>
                    data.onSetPermissionValue(
                      data.userId,
                      permission.nodeIndex,
                      false,
                    )
                  }
                >
                  Denegar
                </button>
                <button
                  type="button"
                  onClick={() =>
                    data.onRequestContext(
                      data.userId,
                      permission.nodeIndex,
                      permission.context,
                    )
                  }
                >
                  Editar contexto
                </button>
                <button
                  type="button"
                  className="node-context-danger"
                  onClick={() =>
                    data.onRemovePermission(data.userId, permission.nodeIndex)
                  }
                >
                  <Trash2 size={12} aria-hidden="true" /> Eliminar permiso
                </button>
              </div>
            </details>
          </div>
        ))}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        aria-label={`Añadir ${data.displayName} a un grupo`}
      />
    </article>
  );
}

const nodeTypes = { group: GroupCanvasNode, user: UserCanvasNode };

type GraphDialog =
  | { type: "create-group" }
  | { type: "rename-group"; groupName: string }
  | { type: "delete-group"; groupName: string }
  | { type: "primary-group"; userId: string; currentGroup: string | null }
  | {
      type: "create-inheritance";
      groupName: string;
      parentName: string;
    }
  | { type: "create-membership"; userId: string; groupName: string }
  | { type: "remove-inheritance"; groupName: string; parentName: string }
  | { type: "remove-membership"; userId: string; groupName: string }
  | {
      type: "edit-context";
      subject: "group" | "user";
      id: string;
      nodeIndex: number;
    };

type PermissionCanvasProps = {
  backup: LuckPermsBackup | null;
  selectedGroup: string | null;
  selectedUser: string | null;
  onSelectGroup: (groupName: string) => void;
  onSelectUser: (userId: string) => void;
  onCreateGroup: (groupName: string) => void;
  onRenameGroup: (groupName: string, nextName: string) => void;
  onDeleteGroup: (groupName: string) => void;
  onAddPermission: (groupName: string, key: string) => void;
  onSetPermissionValue: (
    groupName: string,
    nodeIndex: number,
    value: boolean,
  ) => void;
  onRemovePermission: (groupName: string, nodeIndex: number) => void;
  onSetPermissionContext: (
    groupName: string,
    nodeIndex: number,
    context: Record<string, string | string[]>,
  ) => void;
  onAddInheritance: (groupName: string, parentName: string) => void;
  onRemoveInheritance: (groupName: string, parentName: string) => void;
  onAddUserMembership: (userId: string, groupName: string) => void;
  onRemoveUserMembership: (userId: string, groupName: string) => void;
  onSetUserPrimaryGroup: (userId: string, groupName: string | null) => void;
  onAddUserPermission: (userId: string, key: string) => void;
  onSetUserPermissionValue: (
    userId: string,
    nodeIndex: number,
    value: boolean,
  ) => void;
  onRemoveUserPermission: (userId: string, nodeIndex: number) => void;
  onSetUserPermissionContext: (
    userId: string,
    nodeIndex: number,
    context: Record<string, string | string[]>,
  ) => void;
  onPrepareTransfer: (groupName: string, nodeIndex: number) => void;
  onRequestImport: () => void;
};

export function PermissionCanvas({
  backup,
  selectedGroup,
  selectedUser,
  onSelectGroup,
  onSelectUser,
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup,
  onAddPermission,
  onSetPermissionValue,
  onRemovePermission,
  onSetPermissionContext,
  onAddInheritance,
  onRemoveInheritance,
  onAddUserMembership,
  onRemoveUserMembership,
  onSetUserPrimaryGroup,
  onAddUserPermission,
  onSetUserPermissionValue,
  onRemoveUserPermission,
  onSetUserPermissionContext,
  onPrepareTransfer,
  onRequestImport,
}: PermissionCanvasProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [dialog, setDialog] = useState<GraphDialog | null>(null);
  const [groupName, setGroupName] = useState("");
  const [contextText, setContextText] = useState("{}");
  const [contextError, setContextError] = useState<string | null>(null);
  const [positions, setPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [dragPositions, setDragPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});

  useEffect(() => {
    const stored = window.localStorage.getItem("hiera-graph-positions");
    if (!stored) return;
    try {
      setPositions(JSON.parse(stored));
    } catch {
      window.localStorage.removeItem("hiera-graph-positions");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "hiera-graph-positions",
      JSON.stringify(positions),
    );
  }, [positions]);

  useEffect(() => {
    if (dialog) {
      dialogRef.current?.showModal();
    } else if (dialogRef.current?.open) {
      dialogRef.current.close();
    }
  }, [dialog]);

  function closeDialog() {
    setDialog(null);
    setGroupName("");
    setContextText("{}");
    setContextError(null);
  }

  function submitDialog(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dialog) return;
    if (dialog.type === "create-group" && groupName.trim()) {
      onCreateGroup(groupName.trim());
    } else if (dialog.type === "rename-group" && groupName.trim()) {
      onRenameGroup(dialog.groupName, groupName.trim());
    } else if (dialog.type === "delete-group") {
      onDeleteGroup(dialog.groupName);
    } else if (dialog.type === "primary-group") {
      onSetUserPrimaryGroup(dialog.userId, groupName || null);
    } else if (dialog.type === "create-inheritance") {
      onAddInheritance(dialog.groupName, dialog.parentName);
    } else if (dialog.type === "create-membership") {
      onAddUserMembership(dialog.userId, dialog.groupName);
    } else if (dialog.type === "remove-inheritance") {
      onRemoveInheritance(dialog.groupName, dialog.parentName);
    } else if (dialog.type === "remove-membership") {
      onRemoveUserMembership(dialog.userId, dialog.groupName);
    } else if (dialog.type === "edit-context") {
      try {
        const context = JSON.parse(contextText) as Record<
          string,
          string | string[]
        >;
        if (!context || Array.isArray(context) || typeof context !== "object") {
          setContextError("El contexto debe ser un objeto JSON.");
          return;
        }
        if (dialog.subject === "group") {
          onSetPermissionContext(dialog.id, dialog.nodeIndex, context);
        } else {
          onSetUserPermissionContext(dialog.id, dialog.nodeIndex, context);
        }
      } catch {
        setContextError("El contexto debe ser JSON válido.");
        return;
      }
    }
    closeDialog();
  }

  function openDialog(next: GraphDialog) {
    setGroupName(
      next.type === "rename-group"
        ? next.groupName
        : next.type === "primary-group"
          ? (next.currentGroup ?? "")
          : "",
    );
    setDialog(next);
  }

  if (!backup) {
    return (
      <section className="permission-canvas-empty workspace">
        <ShieldMinus size={22} aria-hidden="true" />
        <h1>Importa un backup para editar su grafo.</h1>
        <p>
          Los grupos, permisos directos y herencias aparecerán aquí sin subir el
          archivo.
        </p>
        <button
          type="button"
          className="primary-action"
          onClick={onRequestImport}
        >
          Importar backup <FileUp size={16} aria-hidden="true" />
        </button>
      </section>
    );
  }

  const groupNames = Object.keys(backup.groups).sort((left, right) =>
    left.localeCompare(right),
  );
  const parentNamesByGroup = Object.fromEntries(
    groupNames.map((name) => [
      name,
      backup.groups[name].nodes
        .filter((node) => node.type === "inheritance" && node.value)
        .map((node) => node.key.replace(/^group\./, ""))
        .filter((parentName) => groupNames.includes(parentName)),
    ]),
  );
  const groupDepths: Record<string, number> = {};
  function getGroupDepth(name: string, visiting = new Set<string>()): number {
    if (groupDepths[name] !== undefined) return groupDepths[name];
    if (visiting.has(name)) return 0;
    const nextVisiting = new Set(visiting).add(name);
    const depth = Math.max(
      0,
      ...(parentNamesByGroup[name] ?? []).map(
        (parentName) => getGroupDepth(parentName, nextVisiting) + 1,
      ),
    );
    groupDepths[name] = depth;
    return depth;
  }
  for (const name of groupNames) {
    getGroupDepth(name);
  }
  const groupColumns: Record<string, number> = {};
  const groupsByDepth = new Map<number, string[]>();
  for (const name of groupNames) {
    const depth = groupDepths[name] ?? 0;
    const row = groupsByDepth.get(depth) ?? [];
    groupColumns[name] = row.length;
    row.push(name);
    groupsByDepth.set(depth, row);
  }
  const groupLaneWidth = 348;
  const groupLaneHeight = 320;
  const maxGroupDepth = Math.max(0, ...Object.values(groupDepths));
  const userOffsets: Record<string, number> = {};
  const groupNodes: GroupFlowNode[] = groupNames.map((groupName, index) => {
    const group = backup.groups[groupName];
    const permissions = group.nodes
      .map((node, nodeIndex) => ({ node, nodeIndex }))
      .filter(({ node }) => node.type === "permission")
      .map(({ node, nodeIndex }) => ({
        key: node.key,
        value: node.value,
        nodeIndex,
        contextCount: Object.keys(node.context ?? {}).length,
        context: node.context,
      }));
    const inheritanceCount = group.nodes.filter(
      (node) => node.type === "inheritance" && node.value,
    ).length;
    return {
      id: `group:${groupName}`,
      type: "group",
      position: dragPositions[`group:${groupName}`] ??
        positions[`group:${groupName}`] ?? {
          x: (groupColumns[groupName] ?? index) * groupLaneWidth,
          y: (groupDepths[groupName] ?? 0) * groupLaneHeight,
        },
      data: {
        groupName,
        permissionCount: permissions.length,
        inheritanceCount,
        permissions,
        selected: selectedGroup === groupName,
        onSelect: onSelectGroup,
        onAddPermission,
        onSetPermissionValue,
        onRemovePermission,
        onRequestContext: (name, nodeIndex, context) => {
          setContextText(JSON.stringify(context ?? {}, null, 2));
          openDialog({
            type: "edit-context",
            subject: "group",
            id: name,
            nodeIndex,
          });
        },
        onPrepareTransfer,
        onRequestRename: (name) =>
          openDialog({ type: "rename-group", groupName: name }),
        onRequestDelete: (name) =>
          openDialog({ type: "delete-group", groupName: name }),
      },
    };
  });
  const userEntries = Object.entries(backup.users ?? {}).sort(
    ([left], [right]) => left.localeCompare(right),
  );
  const userNodes: UserFlowNode[] = userEntries.map(([userId, user], index) => {
    const primaryGroup = user.primaryGroup ?? null;
    const groupColumn = primaryGroup ? groupColumns[primaryGroup] : undefined;
    const offset = primaryGroup ? (userOffsets[primaryGroup] ?? 0) : index;
    if (primaryGroup) userOffsets[primaryGroup] = offset + 1;
    return {
      id: `user:${userId}`,
      type: "user",
      position: dragPositions[`user:${userId}`] ??
        positions[`user:${userId}`] ?? {
          x:
            (groupColumn ?? index % 4) * groupLaneWidth +
            (primaryGroup ? 0 : 24),
          y:
            (maxGroupDepth + 1) * groupLaneHeight +
            Math.floor(offset / 3) * 220,
        },
      data: {
        userId,
        displayName: user.username ?? userId,
        primaryGroup: user.primaryGroup ?? null,
        memberships: user.nodes
          .filter((node) => node.type === "inheritance" && node.value)
          .map((node) => node.key.replace(/^group\./, "")),
        permissionCount: user.nodes.filter((node) => node.type === "permission")
          .length,
        permissions: user.nodes
          .map((node, nodeIndex) => ({ node, nodeIndex }))
          .filter(({ node }) => node.type === "permission")
          .map(({ node, nodeIndex }) => ({
            key: node.key,
            value: node.value,
            nodeIndex,
            contextCount: Object.keys(node.context ?? {}).length,
            context: node.context,
          })),
        selected: selectedUser === userId,
        onSelect: onSelectUser,
        onRequestPrimaryGroup: (id, currentGroup) =>
          openDialog({ type: "primary-group", userId: id, currentGroup }),
        onAddPermission: onAddUserPermission,
        onSetPermissionValue: onSetUserPermissionValue,
        onRemovePermission: onRemoveUserPermission,
        onRequestContext: (id, nodeIndex, context) => {
          setContextText(JSON.stringify(context ?? {}, null, 2));
          openDialog({ type: "edit-context", subject: "user", id, nodeIndex });
        },
      },
    };
  });
  const nodes = [...groupNodes, ...userNodes];
  const edges: Edge[] = groupNames.flatMap((groupName) =>
    backup.groups[groupName].nodes.flatMap((node) => {
      if (node.type !== "inheritance" || !node.value) return [];
      const parentName = node.key.replace(/^group\./, "");
      return [
        {
          id: `inheritance:${groupName}->${parentName}`,
          source: `group:${groupName}`,
          target: `group:${parentName}`,
          type: "smoothstep",
          label: "hereda",
        },
      ];
    }),
  );
  edges.push(
    ...userEntries.flatMap(([userId, user]) =>
      user.nodes.flatMap((node) => {
        if (node.type !== "inheritance" || !node.value) return [];
        const group = node.key.replace(/^group\./, "");
        return [
          {
            id: `membership:${userId}->${group}`,
            source: `user:${userId}`,
            target: `group:${group}`,
            type: "smoothstep",
            label: "miembro",
            style: { strokeDasharray: "4 3" },
          },
        ];
      }),
    ),
  );

  return (
    <section
      className="permission-canvas-workspace"
      aria-label="Grafo editable de permisos"
    >
      <header className="permission-canvas-toolbar">
        <div>
          <p className="eyebrow">GRAFO DEL BACKUP</p>
          <h1>
            {groupNames.length} grupos, {userNodes.length} usuarios, conexiones
            editables.
          </h1>
        </div>
        <button
          type="button"
          className="primary-action"
          onClick={() => openDialog({ type: "create-group" })}
        >
          <CirclePlus size={15} /> Nuevo grupo
        </button>
      </header>
      <p className="permission-canvas-help">
        Conecta un grupo con su padre para crear una herencia. Selecciona una
        conexión para quitarla. Cada grupo permite buscar sus permisos directos
        y abrir operaciones contextuales.
      </p>
      <p className="sr-only">
        El grafo contiene {groupNames.length} grupos y {userNodes.length}{" "}
        usuarios. Las conexiones continuas representan herencias; las
        discontinuas, membresías.
      </p>
      <div className="permission-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.25}
          maxZoom={1.5}
          onConnect={(connection) => {
            if (!connection.source || !connection.target) return;
            if (!connection.target.startsWith("group:")) return;
            const targetGroup = connection.target.replace(/^group:/, "");
            if (connection.source.startsWith("group:")) {
              openDialog({
                type: "create-inheritance",
                groupName: connection.source.replace(/^group:/, ""),
                parentName: targetGroup,
              });
            } else if (connection.source.startsWith("user:")) {
              openDialog({
                type: "create-membership",
                userId: connection.source.replace(/^user:/, ""),
                groupName: targetGroup,
              });
            }
          }}
          onNodeDragStop={(_, node) => {
            setPositions((current) => ({
              ...current,
              [node.id]: node.position,
            }));
            setDragPositions((current) => {
              const next = { ...current };
              delete next[node.id];
              return next;
            });
          }}
          onNodeDrag={(_, node) =>
            setDragPositions((current) => ({
              ...current,
              [node.id]: node.position,
            }))
          }
          onEdgeClick={(_, edge) => {
            const [kindAndSource, target] = edge.id.split("->");
            const [kind, source] = kindAndSource.split(":");
            if (!source || !target) return;
            if (kind === "inheritance") {
              openDialog({
                type: "remove-inheritance",
                groupName: source,
                parentName: target,
              });
            } else if (kind === "membership") {
              openDialog({
                type: "remove-membership",
                userId: source,
                groupName: target,
              });
            }
          }}
        >
          <Background gap={22} size={1} color="var(--line-strong)" />
          <Controls
            className="permission-canvas-controls"
            position="bottom-right"
            showInteractive={false}
          />
          <Panel className="canvas-legend" position="top-right">
            <div className="canvas-legend-heading">
              <span>MAPA ACTIVO</span>
              <button
                type="button"
                onClick={() => {
                  setPositions({});
                  setDragPositions({});
                }}
              >
                Restablecer
              </button>
            </div>
            <dl>
              <div>
                <dt>
                  <i className="canvas-legend-mark is-group" /> Grupo
                </dt>
                <dd>{groupNames.length}</dd>
              </div>
              <div>
                <dt>
                  <i className="canvas-legend-mark is-user" /> Usuario
                </dt>
                <dd>{userNodes.length}</dd>
              </div>
              <div>
                <dt>
                  <i className="canvas-legend-line" /> Herencia
                </dt>
                <dd>
                  {
                    edges.filter((edge) => edge.id.startsWith("inheritance:"))
                      .length
                  }
                </dd>
              </div>
            </dl>
          </Panel>
        </ReactFlow>
      </div>
      <dialog
        ref={dialogRef}
        className="graph-operation-dialog"
        onClose={closeDialog}
      >
        {dialog && (
          <form method="dialog" onSubmit={submitDialog}>
            <header>
              <div>
                <p className="eyebrow">OPERACIÓN DEL GRAFO</p>
                <h2>
                  {dialog.type === "create-group" && "Crear grupo"}
                  {dialog.type === "rename-group" &&
                    `Renombrar ${dialog.groupName}`}
                  {dialog.type === "delete-group" &&
                    `Eliminar ${dialog.groupName}`}
                  {dialog.type === "primary-group" && "Cambiar grupo primario"}
                  {dialog.type === "create-inheritance" && "Crear herencia"}
                  {dialog.type === "create-membership" && "Añadir membresía"}
                  {dialog.type === "remove-inheritance" && "Quitar herencia"}
                  {dialog.type === "remove-membership" && "Quitar membresía"}
                  {dialog.type === "edit-context" && "Editar contexto"}
                </h2>
              </div>
              <button type="button" aria-label="Cerrar" onClick={closeDialog}>
                ×
              </button>
            </header>
            {dialog.type === "create-group" ||
            dialog.type === "rename-group" ? (
              <label className="group-name-field">
                Nombre del grupo
                <input
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                />
              </label>
            ) : dialog.type === "primary-group" ? (
              <label className="group-name-field">
                Grupo primario
                <select
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                >
                  <option value="">Sin grupo primario</option>
                  {groupNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
            ) : dialog.type === "edit-context" ? (
              <label className="graph-context-field">
                Contexto JSON
                <textarea
                  value={contextText}
                  onChange={(event) => setContextText(event.target.value)}
                  spellCheck={false}
                />
                <span>
                  Ejemplo: {`{"server":"lobby"}`}. Usa {`{}`} para hacerlo
                  global.
                </span>
                {contextError && <small role="alert">{contextError}</small>}
              </label>
            ) : (
              <p className="graph-operation-copy">
                {dialog.type === "delete-group" &&
                  `Eliminarás ${dialog.groupName} y sus nodos directos de esta copia local.`}
                {dialog.type === "create-inheritance" &&
                  `${dialog.groupName} heredará los permisos de ${dialog.parentName}.`}
                {dialog.type === "create-membership" &&
                  `El usuario se añadirá al grupo ${dialog.groupName}.`}
                {dialog.type === "remove-inheritance" &&
                  `${dialog.groupName} dejará de heredar de ${dialog.parentName}.`}
                {dialog.type === "remove-membership" &&
                  `El usuario dejará de pertenecer a ${dialog.groupName}.`}
              </p>
            )}
            <footer>
              <button
                type="button"
                className="line-button"
                onClick={closeDialog}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={
                  dialog.type === "delete-group"
                    ? "danger-action"
                    : "primary-action"
                }
              >
                {dialog.type.startsWith("remove") ||
                dialog.type === "delete-group"
                  ? "Confirmar eliminación"
                  : "Confirmar cambio"}
              </button>
            </footer>
          </form>
        )}
      </dialog>
    </section>
  );
}
