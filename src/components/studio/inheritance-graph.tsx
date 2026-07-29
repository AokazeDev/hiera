"use client";

import {
  Background,
  Controls,
  type Edge,
  Handle,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
} from "@xyflow/react";
import { Info, TriangleAlert } from "lucide-react";
import { useState } from "react";
import {
  buildInheritanceGraph,
  buildPermissionProvenanceGraph,
} from "@/lib/luckperms";
import type { LuckPermsBackup } from "@/lib/permissions";

type InheritanceGraphProps = {
  backup: LuckPermsBackup | null;
  groupName: string | null;
  onSelectGroup: (groupName: string) => void;
  draggingPermissionFrom: string | null;
  draggingCatalogPermission: boolean;
  onDropPermission: (groupName: string) => void;
  onDropCatalogPermission: (groupName: string) => void;
  permissionProvenance: {
    key: string;
    origin: string;
    inherited: boolean;
  } | null;
};

type GraphNodeData = {
  label: string;
  missing: boolean;
  selected: boolean;
  onSelectGroup: (groupName: string) => void;
  draggingPermissionFrom: string | null;
  draggingCatalogPermission: boolean;
  onDropPermission: (groupName: string) => void;
  onDropCatalogPermission: (groupName: string) => void;
};

function GroupGraphNode({ data }: NodeProps<Node<GraphNodeData>>) {
  const [isDropTarget, setIsDropTarget] = useState(false);
  const acceptsDrop =
    !data.missing &&
    (data.draggingCatalogPermission ||
      (data.draggingPermissionFrom !== null &&
        data.draggingPermissionFrom !== data.label));

  return (
    <button
      type="button"
      className={`inheritance-graph-node${data.selected ? " is-selected" : ""}${data.missing ? " is-missing" : ""}${isDropTarget ? " is-drop-target" : ""}`}
      disabled={data.missing}
      onClick={() => data.onSelectGroup(data.label)}
      onDragOver={(event) => {
        if (!acceptsDrop) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        setIsDropTarget(true);
      }}
      onDragLeave={() => setIsDropTarget(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDropTarget(false);
        if (!acceptsDrop) return;
        if (data.draggingCatalogPermission) {
          data.onDropCatalogPermission(data.label);
        } else {
          data.onDropPermission(data.label);
        }
      }}
    >
      <Handle type="target" position={Position.Left} isConnectable={false} />
      {data.missing && <TriangleAlert size={13} aria-hidden="true" />}
      <span>{data.label}</span>
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </button>
  );
}

const nodeTypes = { group: GroupGraphNode };

export function InheritanceGraph({
  backup,
  groupName,
  onSelectGroup,
  draggingPermissionFrom,
  draggingCatalogPermission,
  onDropPermission,
  onDropCatalogPermission,
  permissionProvenance,
}: InheritanceGraphProps) {
  const graph =
    backup && groupName
      ? permissionProvenance
        ? buildPermissionProvenanceGraph(
            backup,
            groupName,
            permissionProvenance.origin,
          )
        : buildInheritanceGraph(backup, groupName)
      : null;

  if (!backup || !groupName || !graph) {
    return (
      <section className="workspace inheritance-graph-empty">
        <Info size={21} aria-hidden="true" />
        <p>Selecciona un grupo para recorrer sus herencias y grupos padre.</p>
      </section>
    );
  }

  const rows = new Map<number, number>();
  const nodes: Node<GraphNodeData>[] = graph.nodes.map((node) => {
    const row = rows.get(node.depth) ?? 0;
    rows.set(node.depth, row + 1);
    return {
      id: node.id,
      type: "group",
      position: { x: node.depth * 250, y: row * 100 },
      data: {
        label: node.label,
        missing: node.missing,
        selected: node.id === groupName,
        onSelectGroup,
        draggingPermissionFrom,
        draggingCatalogPermission,
        onDropPermission,
        onDropCatalogPermission,
      },
      selectable: !node.missing,
    };
  });
  const edges: Edge[] = graph.edges.map((edge) => ({
    ...edge,
    type: "smoothstep",
    interactionWidth: 0,
  }));

  return (
    <section
      className="workspace inheritance-graph-workspace"
      aria-labelledby="inheritance-graph-title"
    >
      <header className="workspace-title">
        <div>
          <h2 id="inheritance-graph-title">
            {permissionProvenance
              ? `Procedencia de ${permissionProvenance.key}`
              : `Herencias de ${groupName}`}
          </h2>
          <p className="editor-intro">
            {permissionProvenance
              ? permissionProvenance.inherited
                ? `Esta es la ruta activa desde ${groupName} hasta el grupo que define directamente el permiso.`
                : `${groupName} define este permiso directamente; no interviene una herencia.`
              : "Las conexiones salen del grupo que hereda hacia su grupo padre. Usa los controles para acercar, alejar o reencuadrar el mapa. Mientras arrastras un permiso desde el editor o catálogo, suéltalo sobre un grupo visible para revisar la operación."}
          </p>
        </div>
        <p className="editor-summary">
          {graph.nodes.length}{" "}
          {permissionProvenance ? "grupos en la ruta" : "grupos visibles"}
        </p>
      </header>
      <div className="inheritance-graph-canvas">
        <ReactFlow
          aria-label={`Grafo de herencias de ${groupName}`}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          nodesFocusable
          edgesFocusable={false}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.35}
          maxZoom={1.5}
          onNodeClick={(_, node) => onSelectGroup(node.id)}
        >
          <Background gap={20} size={1} color="#c6c7bb" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      {permissionProvenance && graph.nodes.length > 0 && (
        <ol
          className="permission-provenance-list"
          aria-label="Ruta textual de procedencia"
        >
          {graph.nodes.map((node, index) => (
            <li key={node.id}>
              <button type="button" onClick={() => onSelectGroup(node.id)}>
                {node.label}
              </button>
              {index < graph.nodes.length - 1 && (
                <span aria-hidden="true"> hereda de </span>
              )}
            </li>
          ))}
        </ol>
      )}
      <p className="inheritance-graph-note">
        {permissionProvenance
          ? "La ruta textual permite revisar y navegar la misma procedencia sin depender del canvas."
          : "El mapa muestra solo la línea de herencia activa para evitar duplicar el estudio. El editor, el catálogo y la lista de herencias directas permanecen disponibles como alternativa completa de teclado."}
      </p>
    </section>
  );
}
